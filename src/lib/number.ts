/**
 * Parse une saisie décimale tolérante en nombre, ou `null` si vide, invalide ou
 * négative. Accepte la virgule (clavier français) comme le point.
 *
 * Aucun arrondi ici : la conversion a lieu à la soumission, jamais au fil de la
 * frappe (un « 12,34 » en cours de saisie ne doit pas être tronqué en « 12,3 »).
 */
export const parseDecimal = (text: string): number | null => {
  if (text.trim() === '') return null;
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
};
