/**
 * Préférences applicatives (clé/valeur JSON). C'est ici que vivent les réglages
 * qui ne sont pas des entités métier : incrément d'eau, état de l'onboarding…
 */
import { eq } from 'drizzle-orm';

import { appSettings } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export const createAppSettingsRepository = (deps: RepositoryDeps) => ({
  /** Requête live-compatible (racine = table) : permet de suivre un réglage. */
  listQuery() {
    return deps.db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
  },

  get(key: string): string | undefined {
    const [row] = deps.db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)
      .all();

    return row?.value;
  },

  set(key: string, value: string): void {
    const timestamp = deps.now();
    deps.db
      .insert(appSettings)
      .values({ key, value, updatedAt: timestamp })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: timestamp } })
      .run();

    recordChange(deps, 'app_settings', key, 'update');
  },

  getJson<T>(key: string): T | undefined {
    const raw = this.get(key);
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  setJson(key: string, value: unknown): void {
    this.set(key, JSON.stringify(value));
  },
});

export type AppSettingsRepository = ReturnType<typeof createAppSettingsRepository>;
