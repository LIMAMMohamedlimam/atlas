/**
 * SPEC-003 — répartition des macronutriments (RG-6 à RG-9).
 */
import { kilocalories, kilograms } from '@/lib/units';

import {
  calculateMacroTargets,
  checkManualCoherence,
  estimateEnergyFromMacros,
  kcalFromMacros,
  MANUAL_COHERENCE_TOLERANCE,
  snapshotFrom,
  sumEntries,
  type FoodNutritionPer100,
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

describe('snapshotFrom — figement des valeurs (ADR-0005, CA-2)', () => {
  const rice: FoodNutritionPer100 = {
    energyKcal: 130,
    proteinG: 2.7,
    carbsG: 28,
    fatG: 0.3,
    sugarsG: null,
    saturatedFatG: null,
    fiberG: null,
    saltG: null,
  };

  it('met 150 g de riz à 195 kcal et les macros à l’échelle (CA-2)', () => {
    const snapshot = snapshotFrom(rice, 150);

    expect(snapshot.kcal).toBe(195);
    expect(snapshot.proteinG).toBeCloseTo(4.05, 6);
    expect(snapshot.carbsG).toBe(42);
    expect(snapshot.fatG).toBeCloseTo(0.45, 6);
  });

  it('laisse une valeur source null à null, jamais 0 ni inventée', () => {
    const snapshot = snapshotFrom(rice, 100);

    expect(snapshot.sugarsG).toBeNull();
    expect(snapshot.saltG).toBeNull();
  });

  it('gère grams = 0 sans produire de NaN', () => {
    const snapshot = snapshotFrom(rice, 0);

    expect(snapshot.kcal).toBe(0);
    expect(snapshot.proteinG).toBe(0);
  });

  it('met un aliment en ml à l’échelle de la même façon', () => {
    const milk: FoodNutritionPer100 = {
      energyKcal: 46,
      proteinG: 3.4,
      carbsG: 4.8,
      fatG: 1.6,
      sugarsG: 4.8,
      saturatedFatG: 1,
      fiberG: null,
      saltG: 0.1,
    };
    const snapshot = snapshotFrom(milk, 200);

    expect(snapshot.kcal).toBeCloseTo(92, 6);
    expect(snapshot.proteinG).toBeCloseTo(6.8, 6);
    expect(snapshot.sugarsG).toBeCloseTo(9.6, 6);
  });
});

describe('estimateEnergyFromMacros (RG-6)', () => {
  it('calcule 4/4/9 quand les trois macros sont connues', () => {
    expect(estimateEnergyFromMacros({ proteinG: 10, carbsG: 20, fatG: 5 })).toBe(165);
  });

  it('accepte des macros à 0, qui sont une information et non une absence', () => {
    expect(estimateEnergyFromMacros({ proteinG: 0, carbsG: 0, fatG: 10 })).toBe(90);
  });

  it('refuse d’estimer dès qu’une seule macro manque', () => {
    // Traiter l'inconnue comme 0 donnerait 40 kcal pour 10 g de protéines : une
    // valeur knowablement trop basse, qui partirait ensuite dans foods.energy_kcal
    // (NOT NULL) puis dans tout l'historique figé. Mieux vaut rien que faux.
    expect(estimateEnergyFromMacros({ proteinG: 10, carbsG: null, fatG: null })).toBeNull();
    expect(estimateEnergyFromMacros({ proteinG: 10, carbsG: 20, fatG: null })).toBeNull();
    expect(estimateEnergyFromMacros({ proteinG: null, carbsG: 20, fatG: 5 })).toBeNull();
  });

  it('renvoie null quand aucune macro n’est connue', () => {
    expect(estimateEnergyFromMacros({ proteinG: null, carbsG: null, fatG: null })).toBeNull();
  });
});

describe('sumEntries (RG-7)', () => {
  it('additionne calories et macros sur plusieurs entrées', () => {
    const totals = sumEntries([
      { kcal: 195, proteinG: 4.05, carbsG: 42, fatG: 0.45 },
      { kcal: 65, proteinG: 1.35, carbsG: 14, fatG: 0.15 },
    ]);

    expect(totals.kcal).toBe(260);
    expect(totals.proteinG).toBeCloseTo(5.4, 6);
    expect(totals.carbsG).toBe(56);
    expect(totals.hasIncompleteData).toBe(false);
  });

  it('compte les macros manquantes comme 0 mais signale des données incomplètes', () => {
    const totals = sumEntries([{ kcal: 300, proteinG: null, carbsG: null, fatG: null }]);

    expect(totals.kcal).toBe(300);
    expect(totals.proteinG).toBe(0);
    expect(totals.hasIncompleteData).toBe(true);
  });

  it('renvoie des zéros sur une liste vide, sans données incomplètes', () => {
    expect(sumEntries([])).toEqual({
      kcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      hasIncompleteData: false,
    });
  });
});
