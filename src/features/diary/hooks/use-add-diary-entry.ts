import { useCallback } from 'react';

import { diaryRepository } from '@/data/repositories';
import type { MealSlot } from '@/data/repositories/diary.repository';
import type { FoodRecord } from '@/data/repositories/food.repository';
import { snapshotFrom } from '@/domain/nutrition/macros';
import type { LocalDay } from '@/lib/date';

export type AddDiaryEntryInput = {
  readonly day: LocalDay;
  readonly mealSlot: MealSlot;
  readonly food: FoodRecord;
  /** Quantité résolue en g ou ml — M1 n'a pas de portions nommées (SPEC-002). */
  readonly amount: number;
  readonly unit: string;
};

export type AddDiaryEntry = (input: AddDiaryEntryInput) => string;

/**
 * Écriture d'une entrée (flux `docs/architecture/overview.md:137-144`) : le
 * snapshot est construit par le domaine (`snapshotFrom`, ADR-0005) PUIS figé par
 * `diary.add()`. Aucun recalcul dans le composant appelant.
 */
export const useAddDiaryEntry = (): AddDiaryEntry =>
  useCallback((input: AddDiaryEntryInput): string => {
    const snapshot = snapshotFrom(input.food, input.amount);

    return diaryRepository.add({
      day: input.day,
      mealSlot: input.mealSlot,
      foodId: input.food.id,
      quantity: input.amount,
      unit: input.unit,
      grams: input.amount,
      foodName: input.food.name,
      foodBrand: input.food.brand,
      nutrition: {
        kcal: snapshot.kcal,
        proteinG: snapshot.proteinG,
        carbsG: snapshot.carbsG,
        fatG: snapshot.fatG,
        sugarsG: snapshot.sugarsG,
        saturatedFatG: snapshot.saturatedFatG,
        fiberG: snapshot.fiberG,
        saltG: snapshot.saltG,
      },
    });
  }, []);
