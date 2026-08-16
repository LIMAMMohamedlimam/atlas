import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { foodRepository } from '@/data/repositories';
import type { MealSlot } from '@/data/repositories/diary.repository';
import { formatKcal } from '@/features/diary/format';
import { useAddDiaryEntry } from '@/features/diary/hooks/use-add-diary-entry';
import { MEAL_SLOTS, MEAL_TITLE_KEYS } from '@/features/diary/meals';
import { localDay, todayLocalDay } from '@/lib/date';
import { parseDecimal } from '@/lib/number';
import { NumberField } from '@/ui/components/number-field';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

type Params = { foodId?: string; mealSlot?: string; day?: string };

const QUANTITY_CONFIRM_THRESHOLD = 10_000;

export default function AddEntryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<Params>();
  const addEntry = useAddDiaryEntry();

  const food = params.foodId ? foodRepository.getById(params.foodId) : undefined;
  const day = params.day ? localDay(params.day) : todayLocalDay();
  const initialMeal: MealSlot = MEAL_SLOTS.includes(params.mealSlot as MealSlot)
    ? (params.mealSlot as MealSlot)
    : 'lunch';

  const [mealSlot, setMealSlot] = useState<MealSlot>(initialMeal);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!food) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textMuted }]}>{t('diary.loadError')}</Text>
      </View>
    );
  }

  const amountValue = parseDecimal(amount);

  const doAdd = () => {
    if (amountValue === null || amountValue === 0) {
      setError(t('diary.quantityZero'));
      return;
    }
    addEntry({ day, mealSlot, food, amount: amountValue, unit: food.baseUnit });
    router.back();
  };

  const onSubmit = () => {
    if (amountValue === null || amountValue === 0) {
      setError(t('diary.quantityZero'));
      return;
    }
    if (amountValue > QUANTITY_CONFIRM_THRESHOLD) {
      Alert.alert(
        t('diary.confirm'),
        t('diary.quantityConfirm', { amount: String(amountValue), name: food.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('diary.confirm'), onPress: doAdd },
        ],
      );
      return;
    }
    doAdd();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
      <Text style={[styles.foodKcal, { color: colors.textMuted }]}>
        {formatKcal(food.energyKcal)} {t('diary.kcal')} / 100 {food.baseUnit}
      </Text>

      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('diary.meal')}</Text>
      <View style={styles.mealRow}>
        {MEAL_SLOTS.map((slot) => (
          <Pressable
            key={slot}
            onPress={() => setMealSlot(slot)}
            accessibilityRole="button"
            accessibilityState={{ selected: mealSlot === slot }}
            style={[
              styles.mealButton,
              {
                backgroundColor: mealSlot === slot ? colors.accent : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.mealLabel,
                { color: mealSlot === slot ? colors.onAccent : colors.text },
              ]}
            >
              {t(MEAL_TITLE_KEYS[slot])}
            </Text>
          </Pressable>
        ))}
      </View>

      <NumberField
        label={`${t('diary.quantity')} (${food.baseUnit})`}
        value={amount}
        onChangeText={setAmount}
        placeholder={t('diary.amountPlaceholder')}
      />

      {error !== null && (
        <Text style={[styles.message, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Pressable
        onPress={onSubmit}
        accessibilityRole="button"
        style={[styles.submit, { backgroundColor: colors.accent }]}
      >
        <Text style={[styles.submitLabel, { color: colors.onAccent }]}>
          {t('diary.addToDiary')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  foodName: typography.title,
  foodKcal: typography.label,
  fieldLabel: typography.label,
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mealButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mealLabel: typography.label,
  message: typography.body,
  submit: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  submitLabel: { ...typography.body, fontWeight: '600' },
});
