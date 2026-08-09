/**
 * Toutes les conversions d'unités du projet passent par ce module.
 * Aucune conversion en ligne ailleurs dans le code (docs/engineering/conventions-code.md).
 */

/** Types nommés : un `number` ne dit pas s'il s'agit de grammes, de kilos ou de calories. */
export type Grams = number & { readonly __brand: 'Grams' };
export type Kilograms = number & { readonly __brand: 'Kilograms' };
export type Centimeters = number & { readonly __brand: 'Centimeters' };
export type Milliliters = number & { readonly __brand: 'Milliliters' };
export type Kilocalories = number & { readonly __brand: 'Kilocalories' };

export const grams = (n: number): Grams => n as Grams;
export const kilograms = (n: number): Kilograms => n as Kilograms;
export const centimeters = (n: number): Centimeters => n as Centimeters;
export const milliliters = (n: number): Milliliters => n as Milliliters;
export const kilocalories = (n: number): Kilocalories => n as Kilocalories;

const LB_PER_KG = 2.2046226218487757;
const CM_PER_INCH = 2.54;
const G_PER_OZ = 28.349523125;
const KJ_PER_KCAL = 4.184;
/** Facteur de conversion sodium → sel (chlorure de sodium). */
const SALT_PER_SODIUM = 2.5;

export const kgToLb = (kg: Kilograms): number => kg * LB_PER_KG;
export const lbToKg = (lb: number): Kilograms => kilograms(lb / LB_PER_KG);

export const cmToInch = (cm: Centimeters): number => cm / CM_PER_INCH;
export const inchToCm = (inch: number): Centimeters => centimeters(inch * CM_PER_INCH);

export const gToOz = (g: Grams): number => g / G_PER_OZ;
export const ozToG = (oz: number): Grams => grams(oz * G_PER_OZ);

/** Open Food Facts fournit parfois l'énergie en kilojoules uniquement. */
export const kjToKcal = (kj: number): Kilocalories => kilocalories(kj / KJ_PER_KCAL);
export const kcalToKj = (kcal: Kilocalories): number => kcal * KJ_PER_KCAL;

/** Les sources donnent tantôt le sodium (mg), tantôt le sel (g). On stocke le sel. */
export const sodiumMgToSaltG = (sodiumMg: number): number => (sodiumMg / 1000) * SALT_PER_SODIUM;
export const saltGToSodiumMg = (saltG: number): number => (saltG / SALT_PER_SODIUM) * 1000;

/**
 * Arrondi d'affichage uniquement. Ne JAMAIS arrondir avant une somme :
 * les arrondis successifs dérivent.
 */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
