import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { foodRepository } from '@/data/repositories';
import { estimateEnergyFromMacros } from '@/domain/nutrition/macros';
import { parseDecimal } from '@/lib/number';
import { NumberField } from '@/ui/components/number-field';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

type Params = { mealSlot?: string; day?: string };

export default function NewFoodScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<Params>();

  const [name, setName] = useState('');
  const [baseUnit, setBaseUnit] = useState<'g' | 'ml'>('g');
  const [energy, setEnergy] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugars, setSugars] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [salt, setSalt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const energyValue = parseDecimal(energy);
  const proteinG = parseDecimal(protein);
  const carbsG = parseDecimal(carbs);
  const fatG = parseDecimal(fat);

  const estimatedEnergy =
    energyValue === null ? estimateEnergyFromMacros({ proteinG, carbsG, fatG }) : null;

  const onSubmit = () => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setError(t('food.nameRequired'));
      return;
    }

    let resolvedEnergy: number;
    let estimated = false;
    if (energyValue !== null) {
      resolvedEnergy = energyValue;
    } else if (estimatedEnergy !== null) {
      resolvedEnergy = estimatedEnergy;
      estimated = true;
    } else {
      setError(t('food.energyRequired'));
      return;
    }

    const foodId = foodRepository.createCustom({
      name: trimmed,
      baseUnit,
      energyIsEstimated: estimated,
      nutrition: {
        energyKcal: resolvedEnergy,
        proteinG,
        carbsG,
        fatG,
        sugarsG: parseDecimal(sugars),
        saturatedFatG: parseDecimal(saturatedFat),
        fiberG: parseDecimal(fiber),
        saltG: parseDecimal(salt),
      },
    });

    const query = new URLSearchParams({ foodId });
    if (params.mealSlot) query.set('mealSlot', params.mealSlot);
    if (params.day) query.set('day', params.day);
    router.replace(`/diary/add?${query.toString()}`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('food.name')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('food.namePlaceholder')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('food.name')}
        style={[
          styles.textInput,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />

      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('food.baseUnit')}</Text>
      <View style={styles.unitRow}>
        <Pressable
          onPress={() => setBaseUnit('g')}
          accessibilityRole="button"
          accessibilityState={{ selected: baseUnit === 'g' }}
          style={[
            styles.unitButton,
            {
              backgroundColor: baseUnit === 'g' ? colors.accent : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.unitLabel, { color: baseUnit === 'g' ? colors.onAccent : colors.text }]}
          >
            g
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setBaseUnit('ml')}
          accessibilityRole="button"
          accessibilityState={{ selected: baseUnit === 'ml' }}
          style={[
            styles.unitButton,
            {
              backgroundColor: baseUnit === 'ml' ? colors.accent : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.unitLabel, { color: baseUnit === 'ml' ? colors.onAccent : colors.text }]}
          >
            ml
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {baseUnit === 'g' ? t('food.per100g') : t('food.per100ml')}
      </Text>

      <NumberField label={t('food.energy')} value={energy} onChangeText={setEnergy} />
      {estimatedEnergy !== null && (
        <Text style={[styles.estimate, { color: colors.textMuted }]}>
          {t('food.estimatedNote')}
        </Text>
      )}
      <NumberField label={t('food.protein')} value={protein} onChangeText={setProtein} optional />
      <NumberField label={t('food.carbs')} value={carbs} onChangeText={setCarbs} optional />
      <NumberField label={t('food.fat')} value={fat} onChangeText={setFat} optional />
      <NumberField label={t('food.sugars')} value={sugars} onChangeText={setSugars} optional />
      <NumberField
        label={t('food.saturatedFat')}
        value={saturatedFat}
        onChangeText={setSaturatedFat}
        optional
      />
      <NumberField label={t('food.fiber')} value={fiber} onChangeText={setFiber} optional />
      <NumberField label={t('food.salt')} value={salt} onChangeText={setSalt} optional />

      {error !== null && (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
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
  fieldLabel: typography.label,
  textInput: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  unitRow: { flexDirection: 'row', gap: spacing.sm },
  unitButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unitLabel: typography.label,
  sectionTitle: typography.title,
  estimate: typography.label,
  error: typography.body,
  submit: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  submitLabel: { ...typography.body, fontWeight: '600' },
});
