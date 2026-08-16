import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { diaryRepository } from '@/data/repositories';
import { parseDecimal } from '@/lib/number';
import { NumberField } from '@/ui/components/number-field';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

type Params = { entryId?: string };

const QUANTITY_CONFIRM_THRESHOLD = 10_000;

export default function EditEntryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<Params>();

  const entry = params.entryId ? diaryRepository.getById(params.entryId) : undefined;
  const [amount, setAmount] = useState(() => (entry ? String(entry.quantity) : ''));
  const [error, setError] = useState<string | null>(null);
  const [recalculated, setRecalculated] = useState(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (backTimer.current !== null) clearTimeout(backTimer.current);
    },
    [],
  );

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textMuted }]}>{t('diary.loadError')}</Text>
      </View>
    );
  }

  const amountValue = parseDecimal(amount);

  const save = () => {
    if (amountValue === null || amountValue === 0) {
      setError(t('diary.quantityZero'));
      return;
    }

    // ADR-0005 — le snapshot est recalculé depuis la fiche courante (true) ou,
    // à défaut de référence relisible, remis à l'échelle depuis les valeurs figées.
    const fromCurrentFood = diaryRepository.updateQuantity(
      entry.id,
      amountValue,
      entry.unit,
      amountValue,
    );

    if (fromCurrentFood) {
      setRecalculated(true);
      backTimer.current = setTimeout(() => router.back(), 1200);
    } else {
      router.back();
    }
  };

  const onSubmit = () => {
    if (amountValue === null || amountValue === 0) {
      setError(t('diary.quantityZero'));
      return;
    }
    if (amountValue > QUANTITY_CONFIRM_THRESHOLD) {
      Alert.alert(
        t('diary.confirm'),
        t('diary.quantityConfirm', { amount: String(amountValue), name: entry.foodNameSnapshot }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('diary.confirm'), onPress: save },
        ],
      );
      return;
    }
    save();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.foodName, { color: colors.text }]}>{entry.foodNameSnapshot}</Text>

      <NumberField
        label={`${t('diary.quantity')} (${entry.unit})`}
        value={amount}
        onChangeText={setAmount}
        placeholder={t('diary.amountPlaceholder')}
      />

      {recalculated && (
        <Text style={[styles.note, { color: colors.textMuted }]} accessibilityRole="alert">
          {t('diary.recalculatedNote')}
        </Text>
      )}

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
        <Text style={[styles.submitLabel, { color: colors.onAccent }]}>{t('common.save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  foodName: typography.title,
  note: typography.label,
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
