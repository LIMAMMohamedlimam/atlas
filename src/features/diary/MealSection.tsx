import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { MealSlot } from '@/data/repositories/diary.repository';
import { spacing, typography, useTheme } from '@/ui/theme';

import { MEAL_TITLE_KEYS } from './meals';
import { formatKcal } from './format';

type Props = {
  mealSlot: MealSlot;
  kcal: number;
  hasEntries: boolean;
};

const mealTitle = (mealSlot: MealSlot, t: TFunction): string => t(MEAL_TITLE_KEYS[mealSlot]);

/** En-tête d'un créneau de repas : titre + sous-total calorique du créneau. */
export function MealSection({ mealSlot, kcal, hasEntries }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {mealTitle(mealSlot, t)}
      </Text>
      <Text style={[styles.kcal, { color: colors.textMuted }]}>
        {hasEntries
          ? `${formatKcal(kcal)} ${t('diary.kcal')}`
          : `${t('common.notSet')} ${t('diary.kcal')}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: typography.title,
  kcal: typography.label,
});
