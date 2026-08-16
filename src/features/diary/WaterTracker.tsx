import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocalDay } from '@/lib/date';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

import { formatKcal } from './format';
import { readWaterIncrementMl, useAddWater } from './hooks/use-add-water';
import { useWaterDay } from './hooks/use-water-day';

type Props = {
  day: LocalDay;
  targetMl: number | null;
};

/** Suivi de l'eau en bas du journal (RG-10 SPEC-001). */
export function WaterTracker({ day, targetMl }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const water = useWaterDay(day);
  const addWater = useAddWater();

  const totalMl = water.state === 'ready' ? water.totalMl : 0;
  const incrementMl = readWaterIncrementMl();

  const accessibilityLabel =
    targetMl !== null
      ? t('water.total', { amount: String(totalMl), target: String(targetMl) })
      : `${totalMl} ml`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header} accessible accessibilityLabel={accessibilityLabel}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {t('water.title')}
        </Text>
        <Text style={[styles.total, { color: colors.text }]}>
          {formatKcal(totalMl)}
          {targetMl !== null ? ` / ${formatKcal(targetMl)}` : ''} ml
        </Text>
      </View>
      <Pressable
        onPress={() => addWater(day, incrementMl)}
        accessibilityRole="button"
        accessibilityLabel={t('water.add', { amount: String(incrementMl) })}
        style={[styles.addButton, { backgroundColor: colors.accent }]}
      >
        <Text style={[styles.addLabel, { color: colors.onAccent }]}>
          + {formatKcal(incrementMl)} ml
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: typography.title,
  total: typography.mono,
  addButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  addLabel: { ...typography.body, fontWeight: '600' },
});
