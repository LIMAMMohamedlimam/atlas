import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './db/client';
import migrations from './db/migrations/migrations';

export type DatabaseStatus =
  { state: 'migrating' } | { state: 'ready' } | { state: 'error'; error: Error };

/**
 * Applique les migrations au démarrage.
 *
 * Une migration ratée est le pire scénario du projet : sans serveur, les données
 * de l'utilisateur n'ont aucun recours. On échoue donc bruyamment plutôt que
 * de laisser l'application démarrer sur une base incohérente.
 */
export const useDatabase = (): DatabaseStatus => {
  const { success, error } = useMigrations(db, migrations);

  if (error) return { state: 'error', error };
  if (!success) return { state: 'migrating' };
  return { state: 'ready' };
};
