import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'atlas.db';

/**
 * PRAGMA appliqués à l'ouverture (docs/architecture/data-model.md#pragma-à-louverture).
 *
 * `foreign_keys` mérite une mention : SQLite le laisse DÉSACTIVÉ par défaut.
 * Sans cette ligne, toutes les clés étrangères du schéma sont décoratives.
 */
const PRAGMAS = [
  'PRAGMA journal_mode = WAL;',
  'PRAGMA foreign_keys = ON;',
  'PRAGMA synchronous = NORMAL;',
  'PRAGMA busy_timeout = 5000;',
].join('\n');

export const sqliteConnection = SQLite.openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true, // requis par useLiveQuery (ADR-0004)
});

sqliteConnection.execSync(PRAGMAS);

export const db = drizzle(sqliteConnection, { schema });

export type Database = typeof db;
