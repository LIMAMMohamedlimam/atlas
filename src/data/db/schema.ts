/**
 * Schéma de la base locale — SOURCE DE VÉRITÉ du modèle de données.
 *
 * Toute modification ici doit être répercutée dans docs/architecture/data-model.md
 * DANS LA MÊME PR, et accompagnée d'une migration générée par `npm run db:generate`.
 *
 * Conventions (docs/architecture/data-model.md#conventions-générales) :
 *   - `id`         TEXT, UUIDv7 généré sur l'appareil
 *   - `created_at` / `updated_at` : epoch millisecondes UTC
 *   - `deleted_at` : suppression LOGIQUE (NULL = actif)
 *   - jours de journal : TEXT `YYYY-MM-DD` en heure locale, jamais un timestamp
 *   - nutriments : REAL pour 100 g ou 100 ml, NULL = inconnu (jamais 0)
 *
 * Jalons : M0 a créé les deux tables d'infrastructure, M1 les six tables de
 * nutrition et de profil. Les tables d'entraînement arrivent en M4.
 */
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/** Préférences applicatives, stockées en clé/valeur JSON. */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Journal des modifications, en prévision d'une synchronisation (v2).
 * Rempli dès la v1, jamais lu tant qu'il n'y a pas de serveur : écrire les
 * déclencheurs maintenant coûte quelques kilo-octets, les rétro-installer
 * dans deux ans coûterait des semaines.
 *
 * Voir docs/architecture/local-first-et-sync.md
 */
export const syncOutbox = sqliteTable(
  'sync_outbox',
  {
    id: text('id').primaryKey(),
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    operation: text('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
    changedAt: integer('changed_at').notNull(),
    syncedAt: integer('synced_at'),
  },
  (table) => [index('idx_outbox_pending').on(table.syncedAt, table.changedAt)],
);

/**
 * Profil utilisateur — UNE SEULE LIGNE, `id` fixé à 'singleton'.
 *
 * Deux entorses assumées aux conventions générales, actées dans
 * docs/architecture/data-model.md#profil-et-objectifs :
 *   - l'`id` n'est pas un UUIDv7 : une ligne unique n'a pas besoin d'être triable
 *     ni fusionnable entre appareils ;
 *   - pas de `deleted_at` : aucun scénario de SPEC-008 ne supprime le profil.
 *     RG-15 ne propose que trois effacements partiels (journal, séances, cache
 *     d'aliments) et RG-14 supprime physiquement la base. Une ligne unique
 *     marquée supprimée serait un état que tout le code devrait gérer pour rien.
 *
 * Le poids courant n'est PAS ici : il vient de `body_measurements`, source unique
 * (RG-12 SPEC-003).
 */
export const userProfile = sqliteTable(
  'user_profile',
  {
    id: text('id').primaryKey().default('singleton'),
    /** L'année suffit pour calculer un âge, et c'est moins intrusif qu'une date complète. */
    birthYear: integer('birth_year'),
    /** Paramètre de la formule de Mifflin-St Jeor uniquement (RG-1 SPEC-003). */
    sex: text('sex', { enum: ['male', 'female', 'unspecified'] }),
    heightCm: real('height_cm'),
    activityLevel: text('activity_level', {
      enum: ['sedentary', 'light', 'moderate', 'very', 'extra'],
    }),
    goalType: text('goal_type', {
      enum: ['lose_slow', 'lose_moderate', 'maintain', 'gain_slow', 'gain_moderate'],
    }),
    /** Le stockage reste métrique : l'impérial est une conversion d'affichage. */
    unitSystem: text('unit_system', { enum: ['metric', 'imperial'] })
      .notNull()
      .default('metric'),
    locale: text('locale').notNull().default('fr'),
    /** 1 = lundi. */
    weekStartsOn: integer('week_starts_on').notNull().default(1),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check('ck_profile_sex', sql`${table.sex} IN ('male', 'female', 'unspecified')`),
    check(
      'ck_profile_activity',
      sql`${table.activityLevel} IN ('sedentary', 'light', 'moderate', 'very', 'extra')`,
    ),
    check(
      'ck_profile_goal',
      sql`${table.goalType} IN ('lose_slow', 'lose_moderate', 'maintain', 'gain_slow', 'gain_moderate')`,
    ),
    check('ck_profile_units', sql`${table.unitSystem} IN ('metric', 'imperial')`),
  ],
);

/**
 * Objectifs nutritionnels HISTORISÉS (RG-10 SPEC-003) : on n'écrase jamais une
 * ligne, on en ajoute une nouvelle avec sa date d'effet.
 *
 * L'objectif applicable à une date D est la ligne active dont `effective_from`
 * est la plus grande parmi celles <= D. C'est ce qui permet au journal du
 * 15 juillet de garder l'objectif de juillet après un changement en août (CA-6).
 */
export const nutritionTargets = sqliteTable(
  'nutrition_targets',
  {
    id: text('id').primaryKey(),
    /** YYYY-MM-DD local. */
    effectiveFrom: text('effective_from').notNull(),
    kcal: real('kcal').notNull(),
    proteinG: real('protein_g').notNull(),
    carbsG: real('carbs_g').notNull(),
    fatG: real('fat_g').notNull(),
    fiberG: real('fiber_g'),
    waterMl: real('water_ml'),
    method: text('method', { enum: ['manual', 'calculated'] }).notNull(),
    /**
     * Traçabilité du calcul : permet de réexpliquer les chiffres des mois plus tard,
     * au lieu de laisser l'utilisateur face à un objectif qu'il ne sait plus justifier.
     */
    calcBmr: real('calc_bmr'),
    calcTdee: real('calc_tdee'),
    calcAdjustmentPct: real('calc_adjustment_pct'),
    /** L'utilisateur a forcé une valeur sous le plancher de sécurité (RG-4 SPEC-003). */
    belowSafetyFloor: integer('below_safety_floor').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (table) => [
    index('idx_targets_effective').on(sql`${table.effectiveFrom} DESC`),
    check('ck_targets_method', sql`${table.method} IN ('manual', 'calculated')`),
  ],
);

/**
 * Mesures corporelles. Le poids saisi ici EST le poids du profil (RG-12 SPEC-003) :
 * une seule source, pas deux valeurs qui divergent.
 */
export const bodyMeasurements = sqliteTable(
  'body_measurements',
  {
    id: text('id').primaryKey(),
    /** YYYY-MM-DD local. */
    day: text('day').notNull(),
    weightKg: real('weight_kg'),
    bodyFatPct: real('body_fat_pct'),
    waistCm: real('waist_cm'),
    hipsCm: real('hips_cm'),
    chestCm: real('chest_cm'),
    armLeftCm: real('arm_left_cm'),
    armRightCm: real('arm_right_cm'),
    thighLeftCm: real('thigh_left_cm'),
    thighRightCm: real('thigh_right_cm'),
    calfLeftCm: real('calf_left_cm'),
    calfRightCm: real('calf_right_cm'),
    note: text('note'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (table) => [
    /**
     * Une seule mesure par jour (RG-2 SPEC-007), appliqué par la BASE et pas
     * seulement par le code. L'index est PARTIEL : sans le filtre, supprimer une
     * mesure interdirait d'en ressaisir une le même jour.
     */
    uniqueIndex('idx_measurements_day')
      .on(table.day)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

/**
 * Aliments. Toutes les valeurs nutritionnelles sont POUR 100 `base_unit`.
 * NULL signifie « inconnu » et s'affiche « — » : jamais 0, jamais une valeur inventée.
 *
 * Reportées à leurs jalons respectifs :
 *   - `recipe_id`  → M3, la table `recipes` n'existe pas encore ;
 *   - `foods_fts`  → M2, avec la recherche plein texte (SPEC-002).
 */
export const foods = sqliteTable(
  'foods',
  {
    id: text('id').primaryKey(),
    source: text('source', { enum: ['off', 'usda', 'custom', 'recipe'] }).notNull(),
    /** Code Open Food Facts ou fdcId USDA. */
    sourceId: text('source_id'),
    barcode: text('barcode'),
    name: text('name').notNull(),
    brand: text('brand'),
    baseUnit: text('base_unit', { enum: ['g', 'ml'] }).notNull(),

    /** Seul nutriment obligatoire (RG-11 SPEC-002) : sans calories, l'aliment est inutilisable. */
    energyKcal: real('energy_kcal').notNull(),
    proteinG: real('protein_g'),
    carbsG: real('carbs_g'),
    sugarsG: real('sugars_g'),
    fatG: real('fat_g'),
    saturatedFatG: real('saturated_fat_g'),
    fiberG: real('fiber_g'),
    saltG: real('salt_g'),
    /** Micronutriments : colonnes prévues, non exposées dans l'UI v1. */
    sodiumMg: real('sodium_mg'),
    potassiumMg: real('potassium_mg'),
    calciumMg: real('calcium_mg'),
    ironMg: real('iron_mg'),

    /** Calories recalculées depuis les macros en 4/4/9, faute de valeur source (RG-6 SPEC-001). */
    energyIsEstimated: integer('energy_is_estimated').notNull().default(0),
    /** 0-100, complétude de la fiche, sert au tri des résultats de recherche. */
    dataQuality: integer('data_quality'),
    isVerified: integer('is_verified').notNull().default(0),

    /**
     * Dénormalisation volontaire : recalculer « Fréquents » et « Récents » à chaque
     * ouverture de la recherche imposerait un balayage complet de `diary_entries`.
     */
    lastUsedAt: integer('last_used_at'),
    useCount: integer('use_count').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_foods_source')
      .on(table.source, table.sourceId)
      .where(sql`${table.sourceId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    index('idx_foods_barcode')
      .on(table.barcode)
      .where(sql`${table.barcode} IS NOT NULL`),
    index('idx_foods_frequent')
      .on(sql`${table.useCount} DESC`, sql`${table.lastUsedAt} DESC`)
      .where(sql`${table.deletedAt} IS NULL`),
    check('ck_foods_source', sql`${table.source} IN ('off', 'usda', 'custom', 'recipe')`),
    check('ck_foods_base_unit', sql`${table.baseUnit} IN ('g', 'ml')`),
  ],
);

/**
 * Entrées du journal. Le cœur de l'application.
 *
 * SNAPSHOT (RG-3 SPEC-001, ADR-0005) : les valeurs nutritionnelles sont FIGÉES à
 * la saisie. Si la fiche produit change ensuite, l'historique ne bouge pas. Un
 * historique nutritionnel qui se réécrit tout seul n'a aucune valeur.
 *
 * `portion_id` est reporté à M2 : les portions nommées relèvent de SPEC-002, et
 * en M1 les quantités se saisissent en g/ml.
 */
export const diaryEntries = sqliteTable(
  'diary_entries',
  {
    id: text('id').primaryKey(),
    /** YYYY-MM-DD LOCAL (RG-2 SPEC-001) : un repas saisi à 23 h 50 reste sur son jour. */
    day: text('day').notNull(),
    mealSlot: text('meal_slot', {
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),

    /** Référence INDICATIVE : peut pointer vers un aliment supprimé, le snapshot fait foi. */
    foodId: text('food_id').references(() => foods.id),
    /** Tel que saisi par l'utilisateur : 2. */
    quantity: real('quantity').notNull(),
    /** Tel que saisi : 'g', 'ml', 'slice'. */
    unit: text('unit').notNull(),
    /** Résolu en grammes : 60. TOUS les totaux partent d'ici (RG-4 SPEC-001). */
    grams: real('grams').notNull(),

    // ── SNAPSHOT : figé à la saisie, jamais recalculé (ADR-0005) ──
    foodNameSnapshot: text('food_name_snapshot').notNull(),
    foodBrandSnapshot: text('food_brand_snapshot'),
    /** Pour CETTE entrée, pas pour 100 g. */
    kcal: real('kcal').notNull(),
    proteinG: real('protein_g'),
    carbsG: real('carbs_g'),
    fatG: real('fat_g'),
    sugarsG: real('sugars_g'),
    saturatedFatG: real('saturated_fat_g'),
    fiberG: real('fiber_g'),
    saltG: real('salt_g'),

    /** Instant réel de la saisie, distinct du jour de journal. */
    loggedAt: integer('logged_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (table) => [
    /** L'index le plus important de l'app : requête exécutée à chaque ouverture du journal. */
    index('idx_diary_day')
      .on(table.day, table.mealSlot, table.sortOrder)
      .where(sql`${table.deletedAt} IS NULL`),
    index('idx_diary_food').on(table.foodId),
    check(
      'ck_diary_meal_slot',
      sql`${table.mealSlot} IN ('breakfast', 'lunch', 'dinner', 'snack')`,
    ),
  ],
);

/** Suivi de l'eau, séparé des aliments et compté en millilitres (RG-10 SPEC-001). */
export const waterLogs = sqliteTable(
  'water_logs',
  {
    id: text('id').primaryKey(),
    /** YYYY-MM-DD local. */
    day: text('day').notNull(),
    amountMl: real('amount_ml').notNull(),
    loggedAt: integer('logged_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (table) => [
    index('idx_water_day')
      .on(table.day)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export type AppSetting = typeof appSettings.$inferSelect;
export type SyncOutboxEntry = typeof syncOutbox.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type NutritionTarget = typeof nutritionTargets.$inferSelect;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;

export type MealSlot = NonNullable<DiaryEntry['mealSlot']>;
export type FoodSource = NonNullable<Food['source']>;
export type TargetMethod = NonNullable<NutritionTarget['method']>;
