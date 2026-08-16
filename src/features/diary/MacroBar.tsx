import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/ui/theme';

import { formatMacro } from './format';

type Props = {
  label: string;
  color: string;
  value: number;
  target: number;
};

/**
 * Barre de progression d'une macro (protéines / glucides / lipides).
 * La cible est toujours > 0 : ce composant n'est rendu que si un objectif existe.
 */
export function MacroBar({ label, color, value, target }: Props) {
  const { colors } = useTheme();

  const fraction = Math.min(1, Math.max(0, value / target));

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}, ${formatMacro(value)} / ${formatMacro(target)}`}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${fraction * 100}%` }]} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>
        {formatMacro(value)}/{formatMacro(target)} g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 24,
  },
  label: { ...typography.label, width: 72 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  value: typography.mono,
});
