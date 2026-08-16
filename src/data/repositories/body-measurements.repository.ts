/**
 * Mesures corporelles. Le poids saisi ici EST le poids du profil (RG-12 SPEC-003) :
 * une seule source, pas deux valeurs qui divergeraient.
 *
 * Une seule mesure par jour, appliqué par un index unique PARTIEL en base.
 */
import { and, desc, eq, isNull } from 'drizzle-orm';

import type { LocalDay } from '@/lib/date';

import { bodyMeasurements } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export type BodyMeasurementRecord = {
  readonly id: string;
  readonly day: string;
  readonly weightKg: number | null;
  readonly bodyFatPct: number | null;
  readonly waistCm: number | null;
  readonly hipsCm: number | null;
  readonly chestCm: number | null;
  readonly note: string | null;
};

export type SaveMeasurementInput = {
  readonly day: LocalDay;
  readonly weightKg?: number | null;
  readonly bodyFatPct?: number | null;
  readonly note?: string | null;
};

const MEASUREMENT_COLUMNS = {
  id: bodyMeasurements.id,
  day: bodyMeasurements.day,
  weightKg: bodyMeasurements.weightKg,
  bodyFatPct: bodyMeasurements.bodyFatPct,
  waistCm: bodyMeasurements.waistCm,
  hipsCm: bodyMeasurements.hipsCm,
  chestCm: bodyMeasurements.chestCm,
  note: bodyMeasurements.note,
} as const;

export const createBodyMeasurementsRepository = (deps: RepositoryDeps) => ({
  /** Dernière mesure enregistrée (poids courant). */
  getLatest(): BodyMeasurementRecord | undefined {
    const [row] = deps.db
      .select(MEASUREMENT_COLUMNS)
      .from(bodyMeasurements)
      .where(isNull(bodyMeasurements.deletedAt))
      .orderBy(desc(bodyMeasurements.day))
      .limit(1)
      .all();

    return row;
  },

  /**
   * Enregistre (ou remplace) la mesure du jour. L'index unique partiel garantit
   * une seule mesure par jour actif (RG-2 SPEC-007).
   */
  save(input: SaveMeasurementInput): string {
    const id = deps.newId();
    const timestamp = deps.now();

    const [existing] = deps.db
      .select({ id: bodyMeasurements.id })
      .from(bodyMeasurements)
      .where(and(eq(bodyMeasurements.day, input.day), isNull(bodyMeasurements.deletedAt)))
      .limit(1)
      .all();

    const rowId = existing?.id ?? id;

    deps.db
      .insert(bodyMeasurements)
      .values({
        id: rowId,
        day: input.day,
        weightKg: input.weightKg ?? null,
        bodyFatPct: input.bodyFatPct ?? null,
        note: input.note ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: bodyMeasurements.id,
        set: {
          weightKg: input.weightKg ?? null,
          bodyFatPct: input.bodyFatPct ?? null,
          note: input.note ?? null,
          updatedAt: timestamp,
        },
      })
      .run();

    recordChange(deps, 'body_measurements', rowId, existing ? 'update' : 'insert');
    return rowId;
  },
});

export type BodyMeasurementsRepository = ReturnType<typeof createBodyMeasurementsRepository>;
