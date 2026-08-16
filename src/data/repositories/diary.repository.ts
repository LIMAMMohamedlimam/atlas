/**
 * Journal alimentaire — SPEC-001.
 *
 * Deux invariants gouvernent ce fichier :
 *
 *   RG-3 — Une entrée FIGE une copie des valeurs nutritionnelles à la saisie.
 *          Modifier la fiche produit ensuite ne doit jamais bouger l'historique.
 *   RG-5 — Rien n'est effacé physiquement : `deleted_at` permet l'annulation
 *          (CA-5) et la synchronisation future.
 *
 * Conséquence sur `updateQuantity` : le recalcul repart des valeurs FIGÉES de
 * l'entrée, jamais de la fiche produit actuelle. C'est ce qui permet à CA-3
 * (fiche modifiée → entrée inchangée) et CA-4 (quantité modifiée → kcal
 * recalculées) de coexister.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';

import type { LocalDay } from '@/lib/date';

import { diaryEntries } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Valeurs figées pour UNE entrée — déjà mises à l'échelle de la quantité saisie. */
export type EntryNutrition = {
  readonly kcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
  readonly sugarsG?: number | null;
  readonly saturatedFatG?: number | null;
  readonly fiberG?: number | null;
  readonly saltG?: number | null;
};

export type AddEntryInput = {
  readonly day: LocalDay;
  readonly mealSlot: MealSlot;
  readonly foodId: string | null;
  readonly quantity: number;
  readonly unit: string;
  readonly grams: number;
  readonly foodName: string;
  readonly foodBrand?: string | null;
  readonly nutrition: EntryNutrition;
};

export type DiaryEntryRecord = {
  readonly id: string;
  readonly day: string;
  readonly mealSlot: MealSlot;
  readonly sortOrder: number;
  readonly foodId: string | null;
  readonly quantity: number;
  readonly unit: string;
  readonly grams: number;
  readonly foodNameSnapshot: string;
  readonly foodBrandSnapshot: string | null;
  readonly kcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
};

export type DayTotals = {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  /**
   * RG-7 — Vrai si au moins une entrée du jour a une macro inconnue. Les valeurs
   * manquantes comptent comme 0 dans le total, mais l'UI doit signaler
   * « données incomplètes » plutôt que d'afficher un total faussement précis.
   */
  readonly hasIncompleteData: boolean;
};

const ENTRY_COLUMNS = {
  id: diaryEntries.id,
  day: diaryEntries.day,
  mealSlot: diaryEntries.mealSlot,
  sortOrder: diaryEntries.sortOrder,
  foodId: diaryEntries.foodId,
  quantity: diaryEntries.quantity,
  unit: diaryEntries.unit,
  grams: diaryEntries.grams,
  foodNameSnapshot: diaryEntries.foodNameSnapshot,
  foodBrandSnapshot: diaryEntries.foodBrandSnapshot,
  kcal: diaryEntries.kcal,
  proteinG: diaryEntries.proteinG,
  carbsG: diaryEntries.carbsG,
  fatG: diaryEntries.fatG,
} as const;

/** Met une valeur figée à l'échelle d'une nouvelle quantité, sans relire l'aliment. */
const rescale = (value: number | null, ratio: number): number | null =>
  value === null ? null : value * ratio;

export const createDiaryRepository = (deps: RepositoryDeps) => ({
  /** Entrées actives d'un jour, dans l'ordre d'affichage du journal. */
  listByDay(day: LocalDay): DiaryEntryRecord[] {
    return deps.db
      .select(ENTRY_COLUMNS)
      .from(diaryEntries)
      .where(and(eq(diaryEntries.day, day), isNull(diaryEntries.deletedAt)))
      .orderBy(diaryEntries.mealSlot, diaryEntries.sortOrder)
      .all() as DiaryEntryRecord[];
  },

  listByMeal(day: LocalDay, mealSlot: MealSlot): DiaryEntryRecord[] {
    return deps.db
      .select(ENTRY_COLUMNS)
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.day, day),
          eq(diaryEntries.mealSlot, mealSlot),
          isNull(diaryEntries.deletedAt),
        ),
      )
      .orderBy(diaryEntries.sortOrder)
      .all() as DiaryEntryRecord[];
  },

  add(input: AddEntryInput): string {
    const id = deps.newId();
    const timestamp = deps.now();

    const [last] = deps.db
      .select({ maxOrder: sql<number | null>`MAX(${diaryEntries.sortOrder})` })
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.day, input.day),
          eq(diaryEntries.mealSlot, input.mealSlot),
          isNull(diaryEntries.deletedAt),
        ),
      )
      .all();

    deps.db
      .insert(diaryEntries)
      .values({
        id,
        day: input.day,
        mealSlot: input.mealSlot,
        sortOrder: (last?.maxOrder ?? -1) + 1,
        foodId: input.foodId,
        quantity: input.quantity,
        unit: input.unit,
        grams: input.grams,
        foodNameSnapshot: input.foodName,
        foodBrandSnapshot: input.foodBrand ?? null,
        kcal: input.nutrition.kcal,
        proteinG: input.nutrition.proteinG,
        carbsG: input.nutrition.carbsG,
        fatG: input.nutrition.fatG,
        sugarsG: input.nutrition.sugarsG ?? null,
        saturatedFatG: input.nutrition.saturatedFatG ?? null,
        fiberG: input.nutrition.fiberG ?? null,
        saltG: input.nutrition.saltG ?? null,
        loggedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    recordChange(deps, 'diary_entries', id, 'insert');
    return id;
  },

  /**
   * CA-4 — Change la quantité et mets les valeurs à l'échelle.
   *
   * Le ratio part des grammes DÉJÀ enregistrés : l'entrée porte sa propre base
   * nutritionnelle et n'a pas besoin de relire l'aliment, qui a pu changer depuis.
   */
  updateQuantity(id: string, quantity: number, unit: string, grams: number): void {
    const [current] = deps.db
      .select({
        grams: diaryEntries.grams,
        kcal: diaryEntries.kcal,
        proteinG: diaryEntries.proteinG,
        carbsG: diaryEntries.carbsG,
        fatG: diaryEntries.fatG,
      })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, id), isNull(diaryEntries.deletedAt)))
      .limit(1)
      .all();

    if (!current || current.grams === 0) return;

    const ratio = grams / current.grams;

    deps.db
      .update(diaryEntries)
      .set({
        quantity,
        unit,
        grams,
        kcal: current.kcal * ratio,
        proteinG: rescale(current.proteinG, ratio),
        carbsG: rescale(current.carbsG, ratio),
        fatG: rescale(current.fatG, ratio),
        updatedAt: deps.now(),
      })
      .where(eq(diaryEntries.id, id))
      .run();

    recordChange(deps, 'diary_entries', id, 'update');
  },

  /** CA-5 — Suppression LOGIQUE : l'entrée disparaît de l'écran, pas de la base. */
  softDelete(id: string): void {
    deps.db
      .update(diaryEntries)
      .set({ deletedAt: deps.now(), updatedAt: deps.now() })
      .where(eq(diaryEntries.id, id))
      .run();

    recordChange(deps, 'diary_entries', id, 'delete');
  },

  /** CA-5 — « Annuler » restaure l'entrée à l'identique. */
  restore(id: string): void {
    deps.db
      .update(diaryEntries)
      .set({ deletedAt: null, updatedAt: deps.now() })
      .where(eq(diaryEntries.id, id))
      .run();

    recordChange(deps, 'diary_entries', id, 'insert');
  },

  /** RG-5 + RG-7 — Totaux du jour, calculés et jamais stockés. */
  totalsForDay(day: LocalDay): DayTotals {
    const [row] = deps.db
      .select({
        kcal: sql<number | null>`SUM(${diaryEntries.kcal})`,
        proteinG: sql<number | null>`SUM(${diaryEntries.proteinG})`,
        carbsG: sql<number | null>`SUM(${diaryEntries.carbsG})`,
        fatG: sql<number | null>`SUM(${diaryEntries.fatG})`,
        incompleteCount: sql<number>`SUM(CASE WHEN ${diaryEntries.proteinG} IS NULL
             OR ${diaryEntries.carbsG} IS NULL
             OR ${diaryEntries.fatG} IS NULL THEN 1 ELSE 0 END)`,
      })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.day, day), isNull(diaryEntries.deletedAt)))
      .all();

    return {
      kcal: row?.kcal ?? 0,
      proteinG: row?.proteinG ?? 0,
      carbsG: row?.carbsG ?? 0,
      fatG: row?.fatG ?? 0,
      hasIncompleteData: (row?.incompleteCount ?? 0) > 0,
    };
  },

  /**
   * CA-8 — Copie un repas vers un autre jour. Les entrées d'origine ne bougent
   * pas, et les copies reprennent les valeurs FIGÉES : copier un déjeuner d'hier
   * ne le recalcule pas depuis les fiches produit d'aujourd'hui.
   */
  copyMeal(from: { day: LocalDay; mealSlot: MealSlot }, to: { day: LocalDay; mealSlot: MealSlot }) {
    const source = this.listByMeal(from.day, from.mealSlot);

    return source.map((entry) =>
      this.add({
        day: to.day,
        mealSlot: to.mealSlot,
        foodId: entry.foodId,
        quantity: entry.quantity,
        unit: entry.unit,
        grams: entry.grams,
        foodName: entry.foodNameSnapshot,
        foodBrand: entry.foodBrandSnapshot,
        nutrition: {
          kcal: entry.kcal,
          proteinG: entry.proteinG,
          carbsG: entry.carbsG,
          fatG: entry.fatG,
        },
      }),
    );
  },
});

export type DiaryRepository = ReturnType<typeof createDiaryRepository>;
