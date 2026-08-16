/**
 * Socle commun aux repositories.
 *
 * Les dépendances qui varient — la base, la génération d'identifiants, l'horloge —
 * sont INJECTÉES plutôt qu'importées. Deux raisons :
 *   - `src/lib/id` s'appuie sur `expo-crypto`, indisponible sous Node : sans
 *     injection, aucun test d'intégration ne pourrait tourner ;
 *   - un test déterministe a besoin de figer l'horloge et les identifiants.
 *
 * C'est la même discipline que dans `src/lib/date`, où `now` est un paramètre.
 */
import type { Timestamp } from '@/lib/date';

import type { Database } from '../db/client';
import { syncOutbox } from '../db/schema';

export type RepositoryDeps = {
  readonly db: Database;
  readonly newId: () => string;
  readonly now: () => Timestamp;
};

export type ChangeOperation = 'insert' | 'update' | 'delete';

/**
 * Journalise une écriture pour la synchronisation future (v2).
 *
 * Jamais lu tant qu'il n'y a pas de serveur, mais écrit dès la v1 : rétro-installer
 * ce journal sur un historique existant coûterait bien plus cher que de l'alimenter
 * maintenant. Voir docs/architecture/local-first-et-sync.md.
 */
export const recordChange = (
  deps: RepositoryDeps,
  tableName: string,
  rowId: string,
  operation: ChangeOperation,
): void => {
  deps.db
    .insert(syncOutbox)
    .values({
      id: deps.newId(),
      tableName,
      rowId,
      operation,
      changedAt: deps.now(),
      syncedAt: null,
    })
    .run();
};
