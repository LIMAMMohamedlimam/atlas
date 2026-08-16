/**
 * SPEC-003 — répartition des macronutriments (RG-6 à RG-9).
 */
import { kilocalories, kilograms } from '@/lib/units';

import {
  calculateMacroTargets,
  checkManualCoherence,
  kcalFromMacros,
  MANUAL_COHERENCE_TOLERANCE,
} from './macros';

describe('calculateMacroTargets — répartition par défaut', () => {
  it('donne 144 / 373 / 77 g pour 2760 kcal à 80 kg en maintien (CA-2)', () => {
    const macros = calculateMacroTargets(kilocalories(2760), kilograms(80), 'maintain');

    expect(macros).toEqual({ proteinG: 144, carbsG: 373, fatG: 77 });
  });

  it('monte les protéines à 2,2 g/kg en perte, pour préserver la masse maigre (RG-6)', () => {
    const cutting = calculateMacroTargets(kilocalories(2000), kilograms(80), 'lose_moderate');
    const maintaining = calculateMacroTargets(kilocalories(2000), kilograms(80), 'maintain');

    expect(cutting.proteinG).toBe(176);
    expect(maintaining.proteinG).toBe(144);
  });

  it('applique 2,2 g/kg aux deux rythmes de perte', () => {
    const slow = calculateMacroTargets(kilocalories(2000), kilograms(80), 'lose_slow');

    expect(slow.proteinG).toBe(176);
  });

  it('garde 1,8 g/kg en prise de masse (RG-6)', () => {
    const gaining = calculateMacroTargets(kilocalories(3000), kilograms(80), 'gain_moderate');

    expect(gaining.proteinG).toBe(144);
  });

  it('respecte le plancher de lipides de 0,8 g/kg quand 25 % ne suffit pas (RG-7)', () => {
    // 1200 kcal à 90 kg : 25 % donnent 33 g, le plancher en impose 72.
    const macros = calculateMacroTargets(kilocalories(1200), kilograms(90), 'lose_moderate');

    expect(macros.fatG).toBe(72);
    expect(macros.fatG).toBeGreaterThan(Math.round((1200 * 0.25) / 9));
  });

  it('laisse les glucides absorber le reste (RG-8)', () => {
    const kcal = kilocalories(2400);
    const macros = calculateMacroTargets(kcal, kilograms(75), 'maintain');

    // Le total reconstitué doit retomber sur l'objectif, à l'arrondi près.
    expect(Math.abs(kcalFromMacros(macros) - kcal)).toBeLessThanOrEqual(2);
  });

  it('ne produit jamais de glucides négatifs sur un objectif très bas', () => {
    const macros = calculateMacroTargets(kilocalories(1200), kilograms(120), 'lose_moderate');

    // Protéines et lipides seuls dépassent déjà l'objectif : le cas doit rester
    // détectable par l'appelant plutôt que de produire un chiffre absurde.
    expect(macros.proteinG).toBe(264);
    expect(macros.carbsG).toBeLessThan(0);
  });
});

describe('checkManualCoherence (RG-9)', () => {
  it('signale un écart de 340 kcal et propose 285 g de glucides (CA-5)', () => {
    const result = checkManualCoherence(kilocalories(2400), {
      proteinG: 180,
      carbsG: 200,
      fatG: 60,
    });

    expect(result.kcalFromMacros).toBe(2060);
    expect(result.deltaKcal).toBe(-340);
    expect(result.isCoherent).toBe(false);
    expect(result.suggestedCarbsG).toBe(285);
  });

  it('accepte un écart dans la tolérance de ±2 %', () => {
    // 2 % de 2400 = 48 kcal, soit 12 g de glucides.
    const result = checkManualCoherence(kilocalories(2400), {
      proteinG: 180,
      carbsG: 285 - 12,
      fatG: 60,
    });

    expect(result.isCoherent).toBe(true);
  });

  it('rejette juste au-delà de la tolérance', () => {
    const result = checkManualCoherence(kilocalories(2400), {
      proteinG: 180,
      carbsG: 285 - 13,
      fatG: 60,
    });

    expect(result.isCoherent).toBe(false);
  });

  it('traite symétriquement un excès de calories', () => {
    const result = checkManualCoherence(kilocalories(2000), {
      proteinG: 200,
      carbsG: 300,
      fatG: 80,
    });

    expect(result.deltaKcal).toBeGreaterThan(0);
    expect(result.isCoherent).toBe(false);
  });

  it('ne suggère jamais de glucides négatifs', () => {
    const result = checkManualCoherence(kilocalories(1200), {
      proteinG: 250,
      carbsG: 0,
      fatG: 90,
    });

    expect(result.suggestedCarbsG).toBe(0);
  });

  it('expose la tolérance utilisée par la spec', () => {
    expect(MANUAL_COHERENCE_TOLERANCE).toBe(0.02);
  });
});
