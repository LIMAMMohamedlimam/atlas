/// <reference types="node" />
/**
 * Base de test en mémoire pour les tests d'intégration des repositories.
 *
 * `better-sqlite3` est une dépendance de DÉVELOPPEMENT uniquement : elle ne part
 * jamais dans l'app, qui utilise `expo-sqlite`. Elle est retenue parce que son
 * pilote Drizzle est en mode `'sync'`, exactement comme celui d'expo-sqlite —
 * `sqlite-proxy`, l'alternative sans dépendance, est asynchrone et ferait diverger
 * les tests du code réellement exécuté sur l'appareil.
 *
 * On applique les VRAIES migrations livrées, pas un schéma reconstruit à la main :
 * un test qui invente son propre schéma ne teste plus rien.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import type { Timestamp } from '@/lib/date';

import type { Database } from '../../db/client';
import * as schema from '../../db/schema';
import type { RepositoryDeps } from '../shared';

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'db', 'migrations');

const applyAllMigrations = (raw: BetterSqlite3.Database): void => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    for (const statement of content.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) raw.exec(trimmed);
    }
  }
};

export type TestContext = {
  readonly deps: RepositoryDeps;
  /** Avance l'horloge de test, pour distinguer deux écritures successives. */
  readonly tick: () => void;
  readonly close: () => void;
};

export const createTestContext = (): TestContext => {
  const raw = new BetterSqlite3(':memory:');
  raw.pragma('foreign_keys = ON');
  applyAllMigrations(raw);

  // Les deux pilotes exposent le même mode `'sync'` mais des types de résultat
  // distincts : la conversion reste cantonnée à ce harnais de test.
  const db = drizzle(raw, { schema }) as unknown as Database;

  let counter = 0;
  let clock = 1_755_000_000_000;

  return {
    deps: {
      db,
      newId: () => `test-id-${String(++counter).padStart(4, '0')}`,
      now: () => clock as Timestamp,
    },
    tick: () => {
      clock += 1000;
    },
    close: () => raw.close(),
  };
};
