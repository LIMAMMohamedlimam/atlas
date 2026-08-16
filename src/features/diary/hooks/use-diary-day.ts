import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { diaryRepository, nutritionTargetsRepository } from '@/data/repositories';
import type { DiaryEntryRecord, MealSlot } from '@/data/repositories/diary.repository';
import type { TargetRecord } from '@/data/repositories/nutrition-targets.repository';
import { sumEntries, type DaySummary } from '@/domain/nutrition/macros';
import type { LocalDay } from '@/lib/date';

import { MEAL_SLOTS } from '../meals';

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
 * Journal d'un jour (ADR-0004) : encapsule le repository et les live queries.
 * Les composants ne voient ni SQL ni Drizzle.
 *
 * Contrainte `useLiveQuery` : la racine de la requête doit être une table. On
 * charge donc les entrées via `listByDayQuery(day)`, puis on calcule les totaux
 * avec `sumEntries()` sur les lignes déjà en mémoire — jamais via l'agrégat SQL
 * de `totalsForDay()`, incompatible avec la live query. L'objectif suit une
 * SECONDE live query : modifié dans les réglages, le journal se rafraîchit seul.
 */
export const useDiaryDay = (day: LocalDay): DiaryDayResult => {
  const entriesQuery = useLiveQuery(diaryRepository.listByDayQuery(day), [day]);
  const targetQuery = useLiveQuery(nutritionTargetsRepository.forDayQuery(day), [day]);

  if (entriesQuery.error) return { state: 'error', error: entriesQuery.error };
  if (targetQuery.error) return { state: 'error', error: targetQuery.error };
  // `updatedAt` reste indéfini tant que la première lecture n'est pas résolue.
  if (entriesQuery.updatedAt === undefined || targetQuery.updatedAt === undefined) {
    return { state: 'loading' };
  }

  const totals = sumEntries(entriesQuery.data);
  const target = targetQuery.data[0];
  const meals = MEAL_SLOTS.map((mealSlot) => {
    const entries = entriesQuery.data.filter((entry) => entry.mealSlot === mealSlot);
    return { mealSlot, entries, kcal: sumEntries(entries).kcal };
  });

  return { state: 'ready', meals, totals, target };
};
