import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { MIN_TOUCH_TARGET, spacing, typography, useTheme } from '@/ui/theme';

import { formatKcal } from './format';

type Props = {
  id: string;
  name: string;
  amountLabel: string;
  kcal: number;
  onDelete: (id: string) => void;
};

/**
 * Ligne d'une entrée de journal. `React.memo` : c'est la ligne la plus répétée
 * de l'écran, ses props sont des primitives stables (ou un callback stable).
 * Balayage vers la gauche → suppression (CA-5).
 */
export const DiaryEntryRow = memo(function DiaryEntryRow({
  id,
  name,
  amountLabel,
  kcal,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          onPress={() => onDelete(id)}
          accessibilityRole="button"
          accessibilityLabel={t('diary.deleteEntry')}
          style={[styles.deleteAction, { backgroundColor: colors.danger }]}
        >
          <Text style={[styles.deleteLabel, { color: colors.onAccent }]}>{t('common.delete')}</Text>
        </Pressable>
      )}
    >
      <View
        style={[styles.row, { backgroundColor: colors.surface }]}
        accessible
        accessibilityLabel={`${name}, ${amountLabel}, ${formatKcal(kcal)} ${t('diary.kcal')}`}
      >
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.amount, { color: colors.textMuted }]}>{amountLabel}</Text>
          <Text style={[styles.kcal, { color: colors.text }]}>{formatKcal(kcal)}</Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  name: { ...typography.body, flex: 1 },
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  amount: typography.label,
  kcal: typography.mono,
  deleteAction: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: typography.label,
});
