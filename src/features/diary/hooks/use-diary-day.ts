import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { diaryRepository, nutritionTargetsRepository } from '@/data/repositories';
import type { DiaryEntryRecord, MealSlot } from '@/data/repositories/diary.repository';
import type { TargetRecord } from '@/data/repositories/nutrition-targets.repository';
import { sumEntries, type DaySummary } from '@/domain/nutrition/macros';
import type { LocalDay } from '@/lib/date';

/** Les quatre créneaux, dans l'ordre d'affichage du journal (RG-1). */
export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type MealGroup = {
  readonly mealSlot: MealSlot;
  readonly entries: readonly DiaryEntryRecord[];
  readonly kcal: number;
};

export type DiaryDayResult =
  | { readonly state: 'loading' }
  | { readonly state: 'error'; readonly error: Error }
  | {
      readonly state: 'ready';
      readonly meals: readonly MealGroup[];
      readonly totals: DaySummary;
      readonly target: TargetRecord | undefined;
    };

/**
 * Journal d'un jour (ADR-0004) : encapsule le repository et la live query.
 * Les composants ne voient ni SQL ni Drizzle.
 *
 * Contrainte `useLiveQuery` : la racine de la requête doit être une table. On
 * charge donc les entrées via `listByDayQuery(day)`, puis on calcule les totaux
 * avec `sumEntries()` sur les lignes déjà en mémoire — jamais via l'agrégat SQL
 * de `totalsForDay()`, incompatible avec la live query.
 */
export const useDiaryDay = (day: LocalDay): DiaryDayResult => {
  const { data, error, updatedAt } = useLiveQuery(diaryRepository.listByDayQuery(day), [day]);

  if (error) return { state: 'error', error };
  // `updatedAt` reste indéfini tant que la première lecture n'est pas résolue.
  if (updatedAt === undefined) return { state: 'loading' };

  const totals = sumEntries(data);
  const target = nutritionTargetsRepository.forDay(day);
  const meals = MEAL_SLOTS.map((mealSlot) => {
    const entries = data.filter((entry) => entry.mealSlot === mealSlot);
    return { mealSlot, entries, kcal: sumEntries(entries).kcal };
  });

  return { state: 'ready', meals, totals, target };
};
