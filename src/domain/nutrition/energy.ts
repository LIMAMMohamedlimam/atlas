/**
 * Besoins énergétiques — SPEC-003, règles RG-1 à RG-5.
 *
 * TypeScript pur : aucune I/O, aucun React, aucune date « maintenant » implicite.
 * Tout ce dont ces fonctions ont besoin leur est passé en paramètre, ce qui les
 * rend testables sans émulateur et déterministes.
 *
 * ⚠️ Ces calculs touchent à la santé. Le plancher de sécurité (RG-4) n'est pas
 * une option d'affichage : il est appliqué ici, dans le domaine, pour qu'aucun
 * chemin de l'application ne puisse proposer un déficit dangereux par défaut.
 */
import { kilocalories, type Centimeters, type Kilocalories, type Kilograms } from '@/lib/units';

export type Sex = 'male' | 'female' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type GoalType = 'lose_slow' | 'lose_moderate' | 'maintain' | 'gain_slow' | 'gain_moderate';

/** RG-2 : multiplicateurs appliqués au métabolisme de base. */
export const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

/**
 * RG-3 : ajustement en POURCENTAGE, jamais en calories fixes.
 * Un déficit de 500 kcal n'a pas le même sens à 1600 et à 3200 kcal de TDEE.
 */
export const GOAL_ADJUSTMENTS: Readonly<Record<GoalType, number>> = {
  lose_slow: -0.15,
  lose_moderate: -0.2,
  maintain: 0,
  gain_slow: 0.1,
  gain_moderate: 0.15,
};

/**
 * RG-4 : plancher de sécurité. Sous ces valeurs, l'app avertit et plafonne le
 * déficit proposé.
 *
 * `unspecified` n'est pas tranché par la spec. On retient la moyenne des deux
 * seuils, par cohérence avec RG-1 qui moyenne déjà les deux formules dans ce cas.
 * Question ouverte reportée dans SPEC-003 §10.
 */
export const SAFETY_FLOOR_KCAL: Readonly<Record<Sex, number>> = {
  male: 1500,
  female: 1200,
  unspecified: 1350,
};

/** RG-5 : sous cet âge, le calcul assisté est désactivé. */
export const MIN_ASSISTED_AGE = 16;

export type BmrInput = {
  readonly sex: Sex;
  readonly weightKg: Kilograms;
  readonly heightCm: Centimeters;
  readonly ageYears: number;
};

/** Mifflin-St Jeor, partie commune aux deux variantes. */
const mifflinBase = (weightKg: number, heightCm: number, ageYears: number): number =>
  10 * weightKg + 6.25 * heightCm - 5 * ageYears;

/**
 * RG-1 — Métabolisme de base par Mifflin-St Jeor.
 *
 * `unspecified` moyenne les deux formules, ce qui revient à appliquer la moitié
 * de l'écart constant entre elles (+5 pour l'homme, −161 pour la femme).
 * L'UI doit accompagner ce cas d'un avertissement sur la moindre précision.
 */
export const calculateBmr = ({ sex, weightKg, heightCm, ageYears }: BmrInput): Kilocalories => {
  const base = mifflinBase(weightKg, heightCm, ageYears);
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : (5 + -161) / 2;
  return kilocalories(Math.round(base + offset));
};

/** RG-2 — Besoin total quotidien. */
export const calculateTdee = (bmr: Kilocalories, activity: ActivityLevel): Kilocalories =>
  kilocalories(Math.round(bmr * ACTIVITY_FACTORS[activity]));

export type TargetKcalResult = {
  /** Valeur retenue, plancher de sécurité appliqué. C'est elle qu'on propose. */
  readonly kcal: Kilocalories;
  /** Ce qu'aurait donné le calcul sans plancher — utile pour expliquer l'écart. */
  readonly rawKcal: Kilocalories;
  /** Vrai si le plancher a relevé la valeur : l'UI DOIT alors avertir (RG-4). */
  readonly wasRaisedToFloor: boolean;
  readonly floorKcal: Kilocalories;
};

/**
 * RG-3 + RG-4 — Objectif calorique, plancher de sécurité compris.
 *
 * Le plancher ne s'applique qu'à la baisse : il relève un objectif trop bas, il
 * ne plafonne jamais une prise de masse.
 */
export const calculateTargetKcal = (
  tdee: Kilocalories,
  goal: GoalType,
  sex: Sex,
): TargetKcalResult => {
  const rawKcal = Math.round(tdee * (1 + GOAL_ADJUSTMENTS[goal]));
  const floorKcal = SAFETY_FLOOR_KCAL[sex];
  const wasRaisedToFloor = rawKcal < floorKcal;

  return {
    kcal: kilocalories(wasRaisedToFloor ? floorKcal : rawKcal),
    rawKcal: kilocalories(rawKcal),
    wasRaisedToFloor,
    floorKcal: kilocalories(floorKcal),
  };
};

/**
 * RG-5 — Le calcul assisté est réservé aux 16 ans et plus. En dessous, seule la
 * saisie manuelle reste ouverte, accompagnée d'un message d'orientation.
 */
export const isAssistedCalculationAllowed = (ageYears: number): boolean =>
  ageYears >= MIN_ASSISTED_AGE;

/**
 * Âge approché à partir de la seule année de naissance (le profil ne stocke pas
 * la date complète, moins intrusive). L'année courante est passée en paramètre :
 * une fonction du domaine ne lit jamais l'horloge.
 */
export const ageFromBirthYear = (birthYear: number, currentYear: number): number =>
  currentYear - birthYear;
