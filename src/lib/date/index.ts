/**
 * Dates : le piège n°1 de cette application.
 *
 * - Un « jour de journal » est une DATE LOCALE `YYYY-MM-DD`, figée à la saisie.
 *   Un repas enregistré à 23 h 50 à Paris appartient à ce jour-là, quoi qu'en dise UTC,
 *   et il y reste même si l'appareil change de fuseau horaire.
 * - Un « instant » est un entier epoch millisecondes UTC.
 *
 * Voir docs/architecture/local-first-et-sync.md#le-piège-des-dates-en-détail
 */

/** Jour local au format `YYYY-MM-DD`. Se trie correctement en ordre lexicographique. */
export type LocalDay = string & { readonly __brand: 'LocalDay' };

/** Instant absolu : epoch millisecondes UTC. */
export type Timestamp = number & { readonly __brand: 'Timestamp' };

const LOCAL_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number): string => String(n).padStart(2, '0');

export const isLocalDay = (value: string): value is LocalDay => {
  if (!LOCAL_DAY_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Rejette le 31 février et consorts.
  const probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d;
};

export const localDay = (value: string): LocalDay => {
  if (!isLocalDay(value)) throw new RangeError(`Jour local invalide : ${value}`);
  return value;
};

/** Convertit un instant en jour local, dans le fuseau courant de l'appareil. */
export const toLocalDay = (date: Date): LocalDay =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as LocalDay;

export const todayLocalDay = (now: Date = new Date()): LocalDay => toLocalDay(now);

export const nowTimestamp = (now: Date = new Date()): Timestamp => now.getTime() as Timestamp;

/**
 * Décale un jour local de `days` jours. Passe par une date locale à midi pour
 * qu'un changement d'heure (été/hiver) ne fasse jamais sauter ou répéter un jour.
 */
export const addDays = (day: LocalDay, days: number): LocalDay => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const shifted = new Date(y, m - 1, d + days, 12, 0, 0, 0);
  return toLocalDay(shifted);
};

/** Négatif si a < b, 0 si égaux, positif si a > b. Comparaison lexicographique. */
export const compareDays = (a: LocalDay, b: LocalDay): number => (a < b ? -1 : a > b ? 1 : 0);

export const isSameDay = (a: LocalDay, b: LocalDay): boolean => a === b;

export const isFutureDay = (day: LocalDay, today: LocalDay = todayLocalDay()): boolean =>
  compareDays(day, today) > 0;

/** Nombre de jours calendaires entre deux jours locaux (b − a). */
export const daysBetween = (a: LocalDay, b: LocalDay): number => {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number];
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number];
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86_400_000);
};

/** Début de la semaine contenant `day`. `weekStartsOn` : 1 = lundi (défaut), 0 = dimanche. */
export const startOfWeek = (day: LocalDay, weekStartsOn: 0 | 1 = 1): LocalDay => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const local = new Date(y, m - 1, d, 12, 0, 0, 0);
  const offset = (local.getDay() - weekStartsOn + 7) % 7;
  return addDays(day, -offset);
};
