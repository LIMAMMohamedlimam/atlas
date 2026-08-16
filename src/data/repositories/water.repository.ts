/**
 * Suivi de l'eau — RG-10 SPEC-001. L'eau est un journal de logs en millilitres,
 * séparé des aliments : ses totaux ne se mélangent jamais à ceux du journal.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';

import type { LocalDay } from '@/lib/date';

import { waterLogs } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export type WaterLogRecord = {
  readonly id: string;
  readonly day: string;
  readonly amountMl: number;
};

const WATER_COLUMNS = {
  id: waterLogs.id,
  day: waterLogs.day,
  amountMl: waterLogs.amountMl,
} as const;

export const createWaterRepository = (deps: RepositoryDeps) => ({
  /** Requête live-compatible (racine = table) pour useLiveQuery. */
  listByDayQuery(day: LocalDay) {
    return deps.db
      .select(WATER_COLUMNS)
      .from(waterLogs)
      .where(and(eq(waterLogs.day, day), isNull(waterLogs.deletedAt)))
      .orderBy(waterLogs.loggedAt, waterLogs.createdAt);
  },

  listByDay(day: LocalDay): WaterLogRecord[] {
    return this.listByDayQuery(day).all() as WaterLogRecord[];
  },

  /** Total en ml d'un jour, calculé et jamais stocké. */
  totalForDay(day: LocalDay): number {
    const [row] = deps.db
      .select({ total: sql<number | null>`SUM(${waterLogs.amountMl})` })
      .from(waterLogs)
      .where(and(eq(waterLogs.day, day), isNull(waterLogs.deletedAt)))
      .all();

    return row?.total ?? 0;
  },

  add(day: LocalDay, amountMl: number): string {
    const id = deps.newId();
    const timestamp = deps.now();

    deps.db
      .insert(waterLogs)
      .values({
        id,
        day,
        amountMl,
        loggedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    recordChange(deps, 'water_logs', id, 'insert');
    return id;
  },

  /** CA-5 — suppression logique, avec possibilité d'annulation. */
  softDelete(id: string): void {
    deps.db
      .update(waterLogs)
      .set({ deletedAt: deps.now(), updatedAt: deps.now() })
      .where(eq(waterLogs.id, id))
      .run();

    recordChange(deps, 'water_logs', id, 'delete');
  },

  restore(id: string): void {
    deps.db
      .update(waterLogs)
      .set({ deletedAt: null, updatedAt: deps.now() })
      .where(eq(waterLogs.id, id))
      .run();

    recordChange(deps, 'water_logs', id, 'insert');
  },
});

export type WaterRepository = ReturnType<typeof createWaterRepository>;
