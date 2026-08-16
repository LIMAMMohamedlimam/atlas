import type { MealSlot } from '@/data/repositories/diary.repository';

/** Les quatre créneaux, dans l'ordre d'affichage du journal (RG-1). */
export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Clé i18n du libellé de chaque créneau. */
export const MEAL_TITLE_KEYS = {
  breakfast: 'diary.breakfast',
  lunch: 'diary.lunch',
  dinner: 'diary.dinner',
  snack: 'diary.snack',
} as const;
