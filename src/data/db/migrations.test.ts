/// <reference types="node" />
/**
 * Tests des migrations — le test le plus important du projet.
 *
 * La directive `reference` ci-dessus ouvre les types Node POUR CE FICHIER SEUL.
 * `tsconfig.json` fixe `types: ["jest"]` afin que le code applicatif ne puisse
 * pas appeler d'API Node : ce test ne doit pas rouvrir cette porte globalement.
 *
 * « Sans serveur, une migration ratée détruit les données de l'utilisateur sans
 * aucun recours » (docs/engineering/strategie-de-tests.md#niveau-2).
 *
 * On applique le SQL réellement livré sur une base SQLite en mémoire, avec les
 * mêmes PRAGMA qu'en production (src/data/db/client.ts). `node:sqlite` est
 * intégré à Node 22+ : aucune dépendance ajoutée pour ces tests.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

/** Retrouve une migration par son préfixe : le suffixe est généré aléatoirement par Drizzle. */
const readMigration = (prefix: string): string => {
  const file = readdirSync(MIGRATIONS_DIR).find(
    (name) => name.startsWith(prefix) && name.endsWith('.sql'),
  );
  if (!file) throw new Error(`Migration ${prefix}* introuvable dans ${MIGRATIONS_DIR}`);
  return readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
};

/** Drizzle sépare ses instructions par ce marqueur, pas par un simple point-virgule. */
const applyMigration = (db: DatabaseSync, migrationSql: string): void => {
  for (const statement of migrationSql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) db.exec(trimmed);
  }
};

/** Reproduit l'ouverture réelle de la base, PRAGMA compris. */
const openDatabase = (): DatabaseSync => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
};

const tableNames = (db: DatabaseSync): string[] =>
  db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
    .all()
    .map((row) => row.name as string);

const NOW = 1_755_000_000_000;

/** Données réalistes insérées AVANT 0001, pour vérifier qu'elle ne détruit rien. */
const seedV0 = (db: DatabaseSync): void => {
  db.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
    'theme',
    '"dark"',
    NOW,
  );
  db.prepare(
    `INSERT INTO sync_outbox (id, table_name, row_id, operation, changed_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('01920000-0000-7000-8000-000000000001', 'app_settings', 'theme', 'insert', NOW, null);
};

const M1_TABLES = [
  'body_measurements',
  'diary_entries',
  'foods',
  'nutrition_targets',
  'user_profile',
  'water_logs',
];

/** Base au dernier état du schéma, prête pour les tests de contraintes. */
const migratedDatabase = (): DatabaseSync => {
  const db = openDatabase();
  applyMigration(db, readMigration('0000'));
  applyMigration(db, readMigration('0001'));
  return db;
};

const insertFood = (db: DatabaseSync, id: string, name = 'Riz basmati cuit'): void => {
  db.prepare(
    `INSERT INTO foods (id, source, name, base_unit, energy_kcal, created_at, updated_at)
     VALUES (?, 'custom', ?, 'g', 130, ?, ?)`,
  ).run(id, name, NOW, NOW);
};

const insertDiaryEntry = (
  db: DatabaseSync,
  overrides: { id: string; mealSlot?: string; foodId?: string | null },
): void => {
  db.prepare(
    `INSERT INTO diary_entries
       (id, day, meal_slot, food_id, quantity, unit, grams,
        food_name_snapshot, kcal, logged_at, created_at, updated_at)
     VALUES (?, '2026-08-16', ?, ?, 150, 'g', 150, 'Riz basmati cuit', 195, ?, ?, ?)`,
  ).run(overrides.id, overrides.mealSlot ?? 'lunch', overrides.foodId ?? null, NOW, NOW, NOW);
};

describe('migration 0001 — tables de nutrition et de profil (M1)', () => {
  it("s'applique sur une base issue de 0000 et crée les six tables du jalon", () => {
    const db = migratedDatabase();

    expect(tableNames(db)).toEqual(expect.arrayContaining(M1_TABLES));
    db.close();
  });

  it('ne perd aucune donnée existante', () => {
    const db = openDatabase();
    applyMigration(db, readMigration('0000'));
    seedV0(db);

    applyMigration(db, readMigration('0001'));

    expect(db.prepare(`SELECT value FROM app_settings WHERE key = 'theme'`).get()).toEqual({
      value: '"dark"',
    });
    expect(db.prepare(`SELECT COUNT(*) AS n FROM sync_outbox`).get()).toEqual({ n: 1 });
    db.close();
  });

  it('crée diary_entries avant foods sans casser la clé étrangère (ordre alphabétique de Drizzle)', () => {
    // SQLite n'exige pas que la table référencée existe au CREATE TABLE : le lien
    // est résolu à l'écriture. Ce test fige ce comportement, sur lequel repose
    // l'ordre de génération de Drizzle.
    const db = migratedDatabase();
    insertFood(db, 'food-1');

    expect(() => insertDiaryEntry(db, { id: 'entry-1', foodId: 'food-1' })).not.toThrow();
    db.close();
  });

  it('refuse une entrée de journal pointant vers un aliment inexistant', () => {
    const db = migratedDatabase();

    expect(() => insertDiaryEntry(db, { id: 'entry-1', foodId: 'food-inconnu' })).toThrow(
      /FOREIGN KEY/i,
    );
    db.close();
  });
});

describe('contraintes CHECK', () => {
  it('rejette un créneau de repas hors des quatre autorisés (RG-1 SPEC-001)', () => {
    const db = migratedDatabase();

    expect(() => insertDiaryEntry(db, { id: 'entry-1', mealSlot: 'brunch' })).toThrow(
      /CHECK constraint failed/i,
    );
    db.close();
  });

  it('accepte les quatre créneaux autorisés', () => {
    const db = migratedDatabase();

    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack']) {
      expect(() => insertDiaryEntry(db, { id: `entry-${slot}`, mealSlot: slot })).not.toThrow();
    }
    db.close();
  });

  it('rejette un sexe invalide mais accepte NULL (RG-1 SPEC-003)', () => {
    const db = migratedDatabase();
    const insertProfile = (sex: string | null) =>
      db
        .prepare(`INSERT INTO user_profile (id, sex, created_at, updated_at) VALUES (?, ?, ?, ?)`)
        .run(`profile-${sex ?? 'null'}`, sex, NOW, NOW);

    expect(() => insertProfile('helicopter')).toThrow(/CHECK constraint failed/i);
    // NULL doit passer : « Je préfère ne pas répondre » et la saisie directe
    // (CA-7 SPEC-003) ne stockent aucune donnée de profil.
    expect(() => insertProfile(null)).not.toThrow();
    expect(() => insertProfile('unspecified')).not.toThrow();
    db.close();
  });

  it("rejette une méthode d'objectif inconnue (RG-10 SPEC-003)", () => {
    const db = migratedDatabase();
    const insertTarget = (method: string) =>
      db
        .prepare(
          `INSERT INTO nutrition_targets
             (id, effective_from, kcal, protein_g, carbs_g, fat_g, method, created_at, updated_at)
           VALUES (?, '2026-08-16', 2400, 180, 260, 70, ?, ?, ?)`,
        )
        .run(`target-${method}`, method, NOW, NOW);

    expect(() => insertTarget('devine')).toThrow(/CHECK constraint failed/i);
    expect(() => insertTarget('calculated')).not.toThrow();
    db.close();
  });
});

describe('index unique partiel de body_measurements (RG-2 SPEC-007)', () => {
  const insertMeasurement = (db: DatabaseSync, id: string, deletedAt: number | null = null) =>
    db
      .prepare(
        `INSERT INTO body_measurements (id, day, weight_kg, created_at, updated_at, deleted_at)
         VALUES (?, '2026-08-16', 80, ?, ?, ?)`,
      )
      .run(id, NOW, NOW, deletedAt);

  it('interdit deux mesures actives le même jour', () => {
    const db = migratedDatabase();
    insertMeasurement(db, 'm1');

    expect(() => insertMeasurement(db, 'm2')).toThrow(/UNIQUE constraint failed/i);
    db.close();
  });

  it('autorise une nouvelle mesure après suppression logique de la précédente', () => {
    // C'est le cas que casse un index unique NON partiel : l'utilisateur supprime
    // sa pesée du jour et ne peut plus jamais en saisir une autre.
    const db = migratedDatabase();
    insertMeasurement(db, 'm1', NOW);

    expect(() => insertMeasurement(db, 'm2')).not.toThrow();
    db.close();
  });
});

describe('valeurs nutritionnelles manquantes (RG-7 SPEC-001)', () => {
  it('accepte une entrée dont les macros sont inconnues mais pas ses calories', () => {
    const db = migratedDatabase();
    insertFood(db, 'food-1');
    insertDiaryEntry(db, { id: 'entry-1', foodId: 'food-1' });

    const row = db.prepare(`SELECT protein_g, kcal FROM diary_entries WHERE id = 'entry-1'`).get();

    // NULL signifie « inconnu » et s'affichera « — ». Jamais 0, jamais inventé.
    expect(row).toEqual({ protein_g: null, kcal: 195 });
    db.close();
  });

  it('refuse un aliment sans calories : seul nutriment obligatoire (RG-11 SPEC-002)', () => {
    const db = migratedDatabase();

    expect(() =>
      db
        .prepare(
          `INSERT INTO foods (id, source, name, base_unit, energy_kcal, created_at, updated_at)
           VALUES ('food-2', 'custom', 'Mystère', 'g', NULL, ?, ?)`,
        )
        .run(NOW, NOW),
    ).toThrow(/NOT NULL constraint failed/i);
    db.close();
  });
});
