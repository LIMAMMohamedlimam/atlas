/**
 * SPEC-003 — composition du plan d'objectifs (CA-1, CA-2, CA-3).
 */
import { centimeters, kilograms } from '@/lib/units';

import { computeGoalPlan } from './goals';

const BASE = {
  sex: 'male' as const,
  birthYear: 1996,
  heightCm: centimeters(180),
  weightKg: kilograms(80),
  activityLevel: 'moderate' as const,
  goalType: 'maintain' as const,
  currentYear: 2026,
};

describe('computeGoalPlan', () => {
  it('donne BMR 1780, TDEE 2759 et objectif 2759 pour un homme de 30 ans (CA-1)', () => {
    const plan = computeGoalPlan(BASE);

    expect(plan.ageYears).toBe(30);
    expect(plan.bmr).toBe(1780);
    expect(plan.tdee).toBe(2759);
    expect(plan.target.kcal).toBe(2759);
    expect(plan.target.wasRaisedToFloor).toBe(false);
  });

  it('répartit les macros par défaut : 144 P / 373 G / 77 L à 2760 kcal (CA-2)', () => {
    const plan = computeGoalPlan({ ...BASE, goalType: 'maintain' });

    expect(plan.macros).toEqual({ proteinG: 144, carbsG: 373, fatG: 77 });
  });

  it('relève un objectif sous le plancher de sécurité (CA-3)', () => {
    // Femme, TDEE ~1400, perte modérée → brut 1120, plancher 1200.
    const plan = computeGoalPlan({
      ...BASE,
      sex: 'female',
      weightKg: kilograms(55),
      heightCm: centimeters(160),
      activityLevel: 'sedentary',
      goalType: 'lose_moderate',
    });

    expect(plan.target.wasRaisedToFloor).toBe(true);
    expect(plan.target.rawKcal).toBeLessThan(plan.target.kcal);
    expect(plan.target.kcal).toBe(1200);
  });

  it('désactive le calcul assisté sous 16 ans (RG-5)', () => {
    const plan = computeGoalPlan({ ...BASE, birthYear: 2012 });

    expect(plan.assistedAllowed).toBe(false);
  });
});
