/**
 * Répartition des macronutriments — SPEC-003, règles RG-6 à RG-9.
 *
 * TypeScript pur, comme energy.ts.
 */
import { kilocalories, type Kilocalories, type Kilograms } from '@/lib/units';

import type { GoalType } from './energy';

/** Énergie par gramme. Constantes physiologiques, pas des réglages. */
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARBS = 4;
export const KCAL_PER_G_FAT = 9;

/**
 * RG-6 — Protéines par kilo de poids corporel, pas en pourcentage des calories :
 * c'est la pratique de référence en musculation. Plus haut en perte, pour
 * préserver la masse maigre.
 */
export const PROTEIN_G_PER_KG = { cutting: 2.2, default: 1.8 } as const;

/** RG-7 — Lipides : part des calories totales, avec un plancher par kilo. */
export const FAT_PCT_OF_KCAL = 0.25;
export const FAT_G_PER_KG_FLOOR = 0.8;

/** RG-9 — Tolérance entre les macros saisies et l'objectif calorique. */
export const MANUAL_COHERENCE_TOLERANCE = 0.02;

const isCutting = (goal: GoalType): boolean => goal === 'lose_slow' || goal === 'lose_moderate';

export type MacroTargets = {
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
};

/**
 * RG-6/7/8 — Répartition par défaut.
 *
 * L'ordre compte : protéines et lipides sont arrondis AVANT que les glucides
 * n'absorbent le reste. C'est volontaire — les trois chiffres affichés doivent
 * se recomposer en l'objectif affiché. Arrondir les glucides en dernier depuis
 * des valeurs non arrondies produirait un total faux à l'écran (CA-2).
 */
export const calculateMacroTargets = (
  kcal: Kilocalories,
  weightKg: Kilograms,
  goal: GoalType,
): MacroTargets => {
  const proteinPerKg = isCutting(goal) ? PROTEIN_G_PER_KG.cutting : PROTEIN_G_PER_KG.default;
  const proteinG = Math.round(proteinPerKg * weightKg);

  const fatFromPct = (kcal * FAT_PCT_OF_KCAL) / KCAL_PER_G_FAT;
  const fatFloor = FAT_G_PER_KG_FLOOR * weightKg;
  const fatG = Math.round(Math.max(fatFromPct, fatFloor));

  const remainingKcal = kcal - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT;
  const carbsG = Math.round(remainingKcal / KCAL_PER_G_CARBS);

  return { proteinG, carbsG, fatG };
};

/** Énergie reconstituée depuis des macros, en 4/4/9. */
export const kcalFromMacros = ({ proteinG, carbsG, fatG }: MacroTargets): Kilocalories =>
  kilocalories(proteinG * KCAL_PER_G_PROTEIN + carbsG * KCAL_PER_G_CARBS + fatG * KCAL_PER_G_FAT);

export type ManualCoherence = {
  /** Ce que valent réellement les macros saisies. */
  readonly kcalFromMacros: Kilocalories;
  /** Écart signé par rapport à l'objectif : négatif = il manque des calories. */
  readonly deltaKcal: number;
  readonly isCoherent: boolean;
  /** Glucides qui rétabliraient l'objectif à protéines et lipides constants. */
  readonly suggestedCarbsG: number;
};

/**
 * RG-9 — En mode manuel, la somme des macros doit correspondre à l'objectif à
 * ±2 % près. Au-delà, l'app propose d'ajuster les glucides — elle propose, elle
 * n'impose pas : l'utilisateur averti a le droit d'un écart assumé.
 */
export const checkManualCoherence = (
  targetKcal: Kilocalories,
  macros: MacroTargets,
): ManualCoherence => {
  const actual = kcalFromMacros(macros);
  const deltaKcal = actual - targetKcal;
  const tolerance = targetKcal * MANUAL_COHERENCE_TOLERANCE;

  const remainingKcal =
    targetKcal - macros.proteinG * KCAL_PER_G_PROTEIN - macros.fatG * KCAL_PER_G_FAT;

  return {
    kcalFromMacros: actual,
    deltaKcal,
    isCoherent: Math.abs(deltaKcal) <= tolerance,
    // Jamais de suggestion négative : on plancherait à zéro plutôt que d'afficher
    // une valeur absurde quand protéines et lipides dépassent déjà l'objectif.
    suggestedCarbsG: Math.max(0, Math.round(remainingKcal / KCAL_PER_G_CARBS)),
  };
};

/** Valeurs nutritionnelles d'un aliment, pour 100 g ou 100 ml. `null` = inconnu. */
export type FoodNutritionPer100 = {
  readonly energyKcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
  readonly sugarsG: number | null;
  readonly saturatedFatG: number | null;
  readonly fiberG: number | null;
  readonly saltG: number | null;
};

/** Valeurs figées pour UNE entrée — déjà mises à l'échelle de la quantité saisie. */
export type EntryNutritionSnapshot = {
  readonly kcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
  readonly sugarsG: number | null;
  readonly saturatedFatG: number | null;
  readonly fiberG: number | null;
  readonly saltG: number | null;
};

/** Met une valeur pour 100 g/ml à l'échelle d'une portion. `null` reste `null`. */
const scaleToPortion = (valuePer100: number | null, grams: number): number | null =>
  valuePer100 === null ? null : (valuePer100 * grams) / 100;

/**
 * ADR-0005 — Construit le snapshot figé d'une entrée de journal à partir des
 * valeurs pour 100 g/ml de l'aliment courant. C'est le SEUL endroit qui construit
 * ces valeurs. Une valeur source `null` reste `null` : jamais 0, jamais inventée.
 */
export const snapshotFrom = (
  foodPer100: FoodNutritionPer100,
  grams: number,
): EntryNutritionSnapshot => ({
  kcal: (foodPer100.energyKcal * grams) / 100,
  proteinG: scaleToPortion(foodPer100.proteinG, grams),
  carbsG: scaleToPortion(foodPer100.carbsG, grams),
  fatG: scaleToPortion(foodPer100.fatG, grams),
  sugarsG: scaleToPortion(foodPer100.sugarsG, grams),
  saturatedFatG: scaleToPortion(foodPer100.saturatedFatG, grams),
  fiberG: scaleToPortion(foodPer100.fiberG, grams),
  saltG: scaleToPortion(foodPer100.saltG, grams),
});

export type MacrosPer100 = {
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
};

/**
 * RG-6 — Calories estimées depuis les macros en 4/4/9, faute de valeur fournie
 * par la source. L'appelant marque alors `energy_is_estimated` sur `foods`.
 *
 * Les TROIS macros sont exigées. Estimer à partir de deux d'entre elles en
 * traitant la troisième comme 0 produirait une valeur systématiquement
 * sous-évaluée — donc fausse, pas approximative. CLAUDE.md est catégorique :
 * « un chiffre faux est pire qu'un chiffre manquant ». Et le risque est ici
 * durable : cette valeur alimente `foods.energy_kcal`, qui est NOT NULL, puis se
 * propage dans chaque entrée de journal figée et dans tous les totaux.
 */
export const estimateEnergyFromMacros = ({
  proteinG,
  carbsG,
  fatG,
}: MacrosPer100): number | null => {
  if (proteinG === null || carbsG === null || fatG === null) return null;

  return proteinG * KCAL_PER_G_PROTEIN + carbsG * KCAL_PER_G_CARBS + fatG * KCAL_PER_G_FAT;
};

/** Entrée minimale requise pour agréger les totaux d'un jour. */
export type EntryMacros = {
  readonly kcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
};

export type DaySummary = {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  /** RG-7 — vrai dès qu'une entrée a une macro inconnue. */
  readonly hasIncompleteData: boolean;
};

/**
 * RG-7 — Totaux du jour. Les macros manquantes comptent comme 0 dans la somme,
 * mais `hasIncompleteData` passe à vrai dès qu'une entrée a une macro inconnue :
 * l'UI doit alors signaler « données incomplètes » plutôt qu'un total faussement
 * précis.
 */
export const sumEntries = (entries: readonly EntryMacros[]): DaySummary => {
  let kcal = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let hasIncompleteData = false;

  for (const entry of entries) {
    kcal += entry.kcal;
    proteinG += entry.proteinG ?? 0;
    carbsG += entry.carbsG ?? 0;
    fatG += entry.fatG ?? 0;
    if (entry.proteinG === null || entry.carbsG === null || entry.fatG === null) {
      hasIncompleteData = true;
    }
  }

  return { kcal, proteinG, carbsG, fatG, hasIncompleteData };
};
