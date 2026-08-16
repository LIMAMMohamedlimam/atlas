/**
 * Plan d'objectifs — composition des fonctions d'energy.ts et macros.ts.
 *
 * C'est LE calcul que l'onboarding et l'écran Objectifs montrent à l'utilisateur
 * avant validation : BMR → TDEE → objectif calorique → répartition des macros.
 * Il vit ici, pur et testé, pour qu'aucun écran ne recompose ces étapes à la main.
 */
import type { Centimeters, Kilocalories, Kilograms } from '@/lib/units';

import {
  ageFromBirthYear,
  calculateBmr,
  calculateTdee,
  calculateTargetKcal,
  isAssistedCalculationAllowed,
  type ActivityLevel,
  type GoalType,
  type Sex,
  type TargetKcalResult,
} from './energy';
import { calculateMacroTargets, type MacroTargets } from './macros';

export type GoalPlanInput = {
  readonly sex: Sex;
  readonly birthYear: number;
  readonly heightCm: Centimeters;
  readonly weightKg: Kilograms;
  readonly activityLevel: ActivityLevel;
  readonly goalType: GoalType;
  readonly currentYear: number;
};

export type GoalPlan = {
  readonly ageYears: number;
  readonly bmr: Kilocalories;
  readonly tdee: Kilocalories;
  readonly target: TargetKcalResult;
  readonly macros: MacroTargets;
  /** RG-5 — le calcul assisté est réservé aux 16 ans et plus. */
  readonly assistedAllowed: boolean;
};

export const computeGoalPlan = (input: GoalPlanInput): GoalPlan => {
  const ageYears = ageFromBirthYear(input.birthYear, input.currentYear);
  const bmr = calculateBmr({
    sex: input.sex,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    ageYears,
  });
  const tdee = calculateTdee(bmr, input.activityLevel);
  const target = calculateTargetKcal(tdee, input.goalType, input.sex);
  const macros = calculateMacroTargets(target.kcal, input.weightKg, input.goalType);

  return {
    ageYears,
    bmr,
    tdee,
    target,
    macros,
    assistedAllowed: isAssistedCalculationAllowed(ageYears),
  };
};
