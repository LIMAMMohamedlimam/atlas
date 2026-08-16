/**
 * SPEC-003 — besoins énergétiques. Chaque test cite la règle ou le critère qu'il
 * vérifie : un test sans référence traçable est un test qu'on ne saura pas quoi
 * faire quand la spec changera (docs/engineering/strategie-de-tests.md).
 */
import { centimeters, kilocalories, kilograms } from '@/lib/units';

import {
  ACTIVITY_FACTORS,
  ageFromBirthYear,
  calculateBmr,
  calculateTargetKcal,
  calculateTdee,
  isAssistedCalculationAllowed,
  MIN_ASSISTED_AGE,
  SAFETY_FLOOR_KCAL,
  type Sex,
} from './energy';

/** Profil de référence de CA-1 : homme, 30 ans, 180 cm, 80 kg. */
const REFERENCE = {
  sex: 'male' as Sex,
  weightKg: kilograms(80),
  heightCm: centimeters(180),
  ageYears: 30,
};

describe('calculateBmr — Mifflin-St Jeor (RG-1)', () => {
  it('donne 1780 kcal pour le profil de référence (CA-1)', () => {
    expect(calculateBmr(REFERENCE)).toBe(1780);
  });

  it('applique un décalage de −161 pour une femme', () => {
    // Même corps, seul le terme constant change : 1780 − 5 − 161 = 1614.
    expect(calculateBmr({ ...REFERENCE, sex: 'female' })).toBe(1614);
  });

  it('moyenne les deux formules quand le sexe n’est pas renseigné', () => {
    const male = calculateBmr({ ...REFERENCE, sex: 'male' });
    const female = calculateBmr({ ...REFERENCE, sex: 'female' });

    expect(calculateBmr({ ...REFERENCE, sex: 'unspecified' })).toBe((male + female) / 2);
  });

  it('reste cohérent aux bornes plausibles de la saisie', () => {
    // Bornes de SPEC-003 §6 : 30–300 kg, 100–250 cm.
    const light = calculateBmr({ ...REFERENCE, weightKg: kilograms(30) });
    const heavy = calculateBmr({ ...REFERENCE, weightKg: kilograms(300) });

    expect(light).toBeGreaterThan(0);
    expect(heavy).toBeGreaterThan(light);
  });

  it("décroît avec l'âge, à corps constant", () => {
    const young = calculateBmr({ ...REFERENCE, ageYears: 20 });
    const older = calculateBmr({ ...REFERENCE, ageYears: 60 });

    expect(older).toBeLessThan(young);
    expect(young - older).toBe(200); // 5 kcal par année, sur 40 ans
  });
});

describe('calculateTdee (RG-2)', () => {
  it('donne 2759 kcal pour le profil de référence, modérément actif (CA-1)', () => {
    expect(calculateTdee(kilocalories(1780), 'moderate')).toBe(2759);
  });

  it('ordonne strictement les cinq niveaux d’activité', () => {
    const bmr = kilocalories(1780);
    const levels = ['sedentary', 'light', 'moderate', 'very', 'extra'] as const;
    const values = levels.map((level) => calculateTdee(bmr, level));

    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(new Set(values).size).toBe(levels.length);
  });

  it('utilise les facteurs exacts de la spec', () => {
    expect(ACTIVITY_FACTORS).toEqual({
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extra: 1.9,
    });
  });
});

describe('calculateTargetKcal (RG-3)', () => {
  it('laisse le TDEE inchangé en maintien (CA-1)', () => {
    const result = calculateTargetKcal(kilocalories(2759), 'maintain', 'male');

    expect(result.kcal).toBe(2759);
    expect(result.wasRaisedToFloor).toBe(false);
  });

  it('applique un pourcentage, pas un nombre fixe de calories', () => {
    // La même intention « perte modérée » retire 20 % dans les deux cas,
    // donc un nombre de calories différent : c'est tout l'objet de RG-3.
    const small = calculateTargetKcal(kilocalories(1600), 'lose_moderate', 'male');
    const large = calculateTargetKcal(kilocalories(3200), 'lose_moderate', 'male');

    expect(large.rawKcal - large.kcal).toBe(0);
    expect(3200 - large.rawKcal).toBe(640);
    expect(1600 - small.rawKcal).toBe(320);
  });

  it('ajoute des calories en prise de masse', () => {
    expect(calculateTargetKcal(kilocalories(2000), 'gain_slow', 'male').kcal).toBe(2200);
    expect(calculateTargetKcal(kilocalories(2000), 'gain_moderate', 'male').kcal).toBe(2300);
  });
});

describe('plancher de sécurité (RG-4) — règle critique', () => {
  it('relève un objectif féminin sous 1200 kcal et signale l’avertissement (CA-3)', () => {
    const result = calculateTargetKcal(kilocalories(1400), 'lose_moderate', 'female');

    expect(result.rawKcal).toBe(1120);
    expect(result.kcal).toBe(1200);
    expect(result.wasRaisedToFloor).toBe(true);
    expect(result.floorKcal).toBe(1200);
  });

  it('relève un objectif masculin sous 1500 kcal', () => {
    const result = calculateTargetKcal(kilocalories(1700), 'lose_moderate', 'male');

    expect(result.rawKcal).toBe(1360);
    expect(result.kcal).toBe(1500);
    expect(result.wasRaisedToFloor).toBe(true);
  });

  it('ne plafonne JAMAIS une prise de masse : le plancher ne joue qu’à la baisse', () => {
    const result = calculateTargetKcal(kilocalories(4000), 'gain_moderate', 'female');

    expect(result.kcal).toBe(4600);
    expect(result.wasRaisedToFloor).toBe(false);
  });

  it('conserve la valeur brute pour pouvoir expliquer l’écart à l’utilisateur', () => {
    const result = calculateTargetKcal(kilocalories(1400), 'lose_moderate', 'female');

    expect(result.kcal - result.rawKcal).toBe(80);
  });

  it('n’avertit pas quand l’objectif touche exactement le plancher', () => {
    // 1500 pile : la valeur est sûre, un avertissement serait du bruit.
    const result = calculateTargetKcal(kilocalories(1500), 'maintain', 'male');

    expect(result.wasRaisedToFloor).toBe(false);
    expect(result.kcal).toBe(1500);
  });

  it('applique un plancher intermédiaire quand le sexe n’est pas renseigné', () => {
    expect(SAFETY_FLOOR_KCAL.unspecified).toBe(1350);
    expect(SAFETY_FLOOR_KCAL.unspecified).toBeGreaterThan(SAFETY_FLOOR_KCAL.female);
    expect(SAFETY_FLOOR_KCAL.unspecified).toBeLessThan(SAFETY_FLOOR_KCAL.male);
  });
});

describe('âge et calcul assisté (RG-5)', () => {
  it('désactive le calcul assisté sous 16 ans', () => {
    expect(isAssistedCalculationAllowed(15)).toBe(false);
    expect(isAssistedCalculationAllowed(MIN_ASSISTED_AGE)).toBe(true);
    expect(isAssistedCalculationAllowed(17)).toBe(true);
  });

  it('déduit l’âge de la seule année de naissance', () => {
    expect(ageFromBirthYear(1996, 2026)).toBe(30);
  });
});
