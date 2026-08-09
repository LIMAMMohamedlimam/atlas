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
 *
 * M0 ne crée que les deux tables d'infrastructure. Les tables métier
 * (foods, diary_entries, workout_sessions…) arrivent avec leurs jalons respectifs.
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

export type AppSetting = typeof appSettings.$inferSelect;
export type SyncOutboxEntry = typeof syncOutbox.$inferSelect;
