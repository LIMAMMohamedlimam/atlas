/**
 * Objectifs nutritionnels historisés — SPEC-003 RG-10/RG-11, SPEC-001 RG-8.
 *
 * Le point délicat de ce fichier tient en une requête : l'objectif applicable à
 * une date D est la ligne active dont `effective_from` est la plus grande parmi
 * celles <= D. C'est ce qui permet au journal du 15 juillet de conserver
 * l'objectif de juillet après un changement en août (CA-6), sans jamais réécrire
 * le passé.
 */
import { and, desc, eq, isNull, lte } from 'drizzle-orm';

import type { LocalDay } from '@/lib/date';

import { nutritionTargets } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export type TargetMethod = 'manual' | 'calculated';

export type SaveTargetInput = {
  readonly effectiveFrom: LocalDay;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG?: number | null;
  readonly waterMl?: number | null;
  readonly method: TargetMethod;
  /** Traçabilité du calcul assisté, pour réexpliquer les chiffres plus tard. */
  readonly calcBmr?: number | null;
  readonly calcTdee?: number | null;
  readonly calcAdjustmentPct?: number | null;
  /** RG-4 — l'utilisateur a forcé une valeur sous le plancher de sécurité. */
  readonly belowSafetyFloor?: boolean;
};

export type TargetRecord = {
  readonly id: string;
  readonly effectiveFrom: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG: number | null;
  readonly waterMl: number | null;
  readonly method: TargetMethod;
  readonly belowSafetyFloor: number;
};

const TARGET_COLUMNS = {
  id: nutritionTargets.id,
  effectiveFrom: nutritionTargets.effectiveFrom,
  kcal: nutritionTargets.kcal,
  proteinG: nutritionTargets.proteinG,
  carbsG: nutritionTargets.carbsG,
  fatG: nutritionTargets.fatG,
  fiberG: nutritionTargets.fiberG,
  waterMl: nutritionTargets.waterMl,
  method: nutritionTargets.method,
  belowSafetyFloor: nutritionTargets.belowSafetyFloor,
} as const;

export const createNutritionTargetsRepository = (deps: RepositoryDeps) => ({
  /**
   * RG-10/RG-11 — Enregistre un NOUVEL objectif. On n'écrase jamais l'ancien :
   * l'historique des objectifs est ce qui rend les journaux passés relisibles.
   */
  save(input: SaveTargetInput): string {
    const id = deps.newId();
    const timestamp = deps.now();

    deps.db
      .insert(nutritionTargets)
      .values({
        id,
        effectiveFrom: input.effectiveFrom,
        kcal: input.kcal,
        proteinG: input.proteinG,
        carbsG: input.carbsG,
        fatG: input.fatG,
        fiberG: input.fiberG ?? null,
        waterMl: input.waterMl ?? null,
        method: input.method,
        calcBmr: input.calcBmr ?? null,
        calcTdee: input.calcTdee ?? null,
        calcAdjustmentPct: input.calcAdjustmentPct ?? null,
        belowSafetyFloor: input.belowSafetyFloor ? 1 : 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    recordChange(deps, 'nutrition_targets', id, 'insert');
    return id;
  },

  /**
   * RG-8 SPEC-001 — Objectif en vigueur à une date donnée.
   * Renvoie `undefined` si aucun objectif n'était encore défini : le journal
   * doit rester utilisable sans objectif (SPEC-003 §6).
   */
  forDay(day: LocalDay): TargetRecord | undefined {
    const [row] = deps.db
      .select(TARGET_COLUMNS)
      .from(nutritionTargets)
      .where(and(lte(nutritionTargets.effectiveFrom, day), isNull(nutritionTargets.deletedAt)))
      .orderBy(desc(nutritionTargets.effectiveFrom), desc(nutritionTargets.createdAt))
      .limit(1)
      .all();

    return row as TargetRecord | undefined;
  },

  /** Objectif courant, c'est-à-dire celui applicable aujourd'hui. */
  current(today: LocalDay): TargetRecord | undefined {
    return this.forDay(today);
  },

  softDelete(id: string): void {
    deps.db
      .update(nutritionTargets)
      .set({ deletedAt: deps.now(), updatedAt: deps.now() })
      .where(eq(nutritionTargets.id, id))
      .run();

    recordChange(deps, 'nutrition_targets', id, 'delete');
  },
});

export type NutritionTargetsRepository = ReturnType<typeof createNutritionTargetsRepository>;
