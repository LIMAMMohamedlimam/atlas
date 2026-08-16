/**
 * Formatage d'affichage uniquement : arrondir à l'affichage, jamais au stockage
 * (conventions-code.md). Les valeurs restent brutes en base (`real`).
 *
 * Les formatters sont créés une fois au chargement du module, avec la locale de
 * l'appareil (espace comme séparateur de milliers en français, etc.).
 */
import type { LocalDay } from '@/lib/date';

const integerFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const macroFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const amountFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** Calories à l'entier. */
export const formatKcal = (value: number): string => integerFormat.format(Math.round(value));

/** Macros à 0,1 g près. */
export const formatMacro = (value: number): string => macroFormat.format(value);

/** Quantité telle que saisie (« 150 », « 1,5 »), sans décimales superflues. */
export const formatAmount = (value: number): string => amountFormat.format(value);

/** Jour local en toutes lettres (« mardi 9 août »), dans la locale de l'appareil. */
export const formatDay = (day: LocalDay): string => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return dayFormat.format(new Date(y, m - 1, d));
};
