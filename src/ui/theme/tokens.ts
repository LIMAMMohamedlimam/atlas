/**
 * Jetons de design. Aucune couleur en dur ailleurs dans l'application.
 *
 * Contrainte transverse : aucune information ne doit reposer sur la seule couleur
 * (docs/engineering/definition-of-done.md#accessibilité). Les couleurs sémantiques
 * ci-dessous accompagnent toujours un texte ou une icône.
 */

export const palette = {
  light: {
    background: '#FBFBFD',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F2F6',
    border: '#E1E3EA',
    text: '#14161C',
    textMuted: '#5C6270',
    textFaint: '#8A909E',
    accent: '#2C6BED',
    onAccent: '#FFFFFF',
    protein: '#C2410C',
    carbs: '#0E7490',
    fat: '#7C3AED',
    over: '#B4530A',
    danger: '#B42318',
  },
  dark: {
    background: '#0F1115',
    surface: '#171A21',
    surfaceMuted: '#1F232B',
    border: '#2A2F39',
    text: '#F2F4F8',
    textMuted: '#A2A9B8',
    textFaint: '#6E7686',
    accent: '#6C9BFF',
    onAccent: '#0F1115',
    protein: '#FB923C',
    carbs: '#38BDF8',
    fat: '#C4B5FD',
    over: '#F5B364',
    danger: '#FF6B60',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = (typeof palette)[ColorScheme];

/** Échelle d'espacement en points, multiples de 4. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500' },
  mono: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
} as const;

/** Taille minimale d'une cible tactile, en points (SPEC-001 §9). */
export const MIN_TOUCH_TARGET = 48;
