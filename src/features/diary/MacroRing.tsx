import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { spacing, typography, useTheme } from '@/ui/theme';

import { formatKcal } from './format';

type Props = {
  consumedKcal: number;
  targetKcal: number;
};

const SIZE = 180;
const STROKE_WIDTH = 14;

/**
 * Anneau de calories (SPEC-001 §8). L'information « au-dessus de l'objectif »
 * n'est jamais portée par la seule couleur : elle s'accompagne d'un libellé
 * (« au-dessus ») et d'un texte complet lisible par un lecteur d'écran.
 */
export function MacroRing({ consumedKcal, targetKcal }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const remaining = targetKcal - consumedKcal;
  const isOver = remaining < 0;
  const fraction = Math.min(1, Math.max(0, consumedKcal / targetKcal));

  const radius = (SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = isOver ? colors.over : colors.accent;
  const magnitude = isOver ? Math.abs(remaining) : remaining;

  const accessibilityLabel = isOver
    ? t('diary.overAccessibility', {
        amount: formatKcal(magnitude),
        total: formatKcal(targetKcal),
      })
    : t('diary.remainingAccessibility', {
        remaining: formatKcal(magnitude),
        total: formatKcal(targetKcal),
      });

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke={colors.surfaceMuted}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.number, { color }]}>{formatKcal(magnitude)}</Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {isOver ? t('diary.over') : t('diary.remaining')}
        </Text>
        <Text style={[styles.total, { color: colors.textFaint }]}>/{formatKcal(targetKcal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    gap: spacing.xs,
  },
  number: { ...typography.display, fontVariant: ['tabular-nums'] },
  label: typography.label,
  total: typography.label,
});
