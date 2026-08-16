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
