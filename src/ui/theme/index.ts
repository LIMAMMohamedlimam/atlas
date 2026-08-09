import { useColorScheme } from 'react-native';

import { palette, type ColorScheme, type ThemeColors } from './tokens';

/** Thème effectif, suivant le réglage système (clair / sombre). */
export const useTheme = (): { scheme: ColorScheme; colors: ThemeColors } => {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palette[scheme] };
};

export { MIN_TOUCH_TARGET, palette, radius, spacing, typography } from './tokens';
export type { ColorScheme, ThemeColors } from './tokens';
