import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  bodyMeasurementsRepository,
  nutritionTargetsRepository,
  userProfileRepository,
} from '@/data/repositories';
import type { UserProfileRecord } from '@/data/repositories/user-profile.repository';
import { GOAL_ADJUSTMENTS, SAFETY_FLOOR_KCAL } from '@/domain/nutrition/energy';
import { computeGoalPlan, type GoalPlan } from '@/domain/nutrition/goals';
import { checkManualCoherence } from '@/domain/nutrition/macros';
import { formatKcal, formatMacro } from '@/features/diary/format';
import { todayLocalDay } from '@/lib/date';
import { parseDecimal } from '@/lib/number';
import { centimeters, kilograms, kilocalories } from '@/lib/units';
import { NumberField } from '@/ui/components/number-field';
import { SelectGroup, type SelectOption } from '@/ui/components/select-group';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

type Method = 'calculated' | 'manual';

const CURRENT_YEAR = new Date().getFullYear();

/** Calcule le plan depuis un profil COMPLET ; `null` sinon (RG-8/9 SPEC-003). */
const planFor = (profile: UserProfileRecord, weightKg: number): GoalPlan | null => {
  if (
    profile.birthYear === null ||
    profile.sex === null ||
    profile.heightCm === null ||
    profile.activityLevel === null ||
    profile.goalType === null
  ) {
    return null;
  }

  return computeGoalPlan({
    sex: profile.sex,
    birthYear: profile.birthYear,
    heightCm: centimeters(profile.heightCm),
    weightKg: kilograms(weightKg),
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
    currentYear: CURRENT_YEAR,
  });
};

/** Réglages → Objectifs : bascule Calculé / Manuel, avec contrôle de cohérence (RG-9). */
export default function GoalsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const current = nutritionTargetsRepository.current(todayLocalDay());
  const profile = userProfileRepository.get();
  const weightKg = bodyMeasurementsRepository.getLatest()?.weightKg ?? null;

  const [method, setMethod] = useState<Method>(current?.method ?? 'manual');
  const [kcal, setKcal] = useState(() => (current ? String(current.kcal) : ''));
  const [protein, setProtein] = useState(() => (current ? String(current.proteinG) : ''));
  const [carbs, setCarbs] = useState(() => (current ? String(current.carbsG) : ''));
  const [fat, setFat] = useState(() => (current ? String(current.fatG) : ''));
  const [error, setError] = useState<string | null>(null);

  const kcalValue = parseDecimal(kcal);
  const proteinG = parseDecimal(protein) ?? 0;
  const carbsG = parseDecimal(carbs) ?? 0;
  const fatG = parseDecimal(fat) ?? 0;

  const coherence =
    kcalValue !== null && kcalValue > 0
      ? checkManualCoherence(kilocalories(kcalValue), { proteinG, carbsG, fatG })
      : null;

  const plan = profile !== undefined && weightKg !== null ? planFor(profile, weightKg) : null;

  const methodOptions: readonly SelectOption<Method>[] = [
    { value: 'calculated', label: t('goals.calculated') },
    { value: 'manual', label: t('goals.manual') },
  ];

  const floorKcal =
    profile?.sex === 'male'
      ? SAFETY_FLOOR_KCAL.male
      : profile?.sex === 'female'
        ? SAFETY_FLOOR_KCAL.female
        : SAFETY_FLOOR_KCAL.unspecified;

  const saveManual = (belowFloor: boolean) => {
    if (kcalValue === null || kcalValue <= 0) return;
    nutritionTargetsRepository.save({
      effectiveFrom: todayLocalDay(),
      kcal: kcalValue,
      proteinG,
      carbsG,
      fatG,
      method: 'manual',
      belowSafetyFloor: belowFloor,
    });
    setError(null);
  };

  const onSubmitManual = () => {
    if (kcalValue === null || kcalValue <= 0) {
      setError(t('food.energyRequired'));
      return;
    }
    if (kcalValue < floorKcal) {
      Alert.alert(t('onboarding.safetyWarning', { floor: String(floorKcal) }), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.save'), onPress: () => saveManual(true) },
      ]);
      return;
    }
    saveManual(false);
  };

  const onSubmitCalculated = () => {
    if (plan === null || profile === undefined || profile.goalType === null) return;
    nutritionTargetsRepository.save({
      effectiveFrom: todayLocalDay(),
      kcal: plan.target.kcal,
      proteinG: plan.macros.proteinG,
      carbsG: plan.macros.carbsG,
      fatG: plan.macros.fatG,
      method: 'calculated',
      calcBmr: plan.bmr,
      calcTdee: plan.tdee,
      calcAdjustmentPct: GOAL_ADJUSTMENTS[profile.goalType],
    });
    setError(null);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {current && (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('goals.current')}</Text>
          <Text style={[styles.bigValue, { color: colors.accent }]}>
            {formatKcal(current.kcal)} kcal
          </Text>
          <Text style={[styles.macros, { color: colors.textMuted }]}>
            {t('onboarding.protein')} {formatMacro(current.proteinG)} · {t('onboarding.carbs')}{' '}
            {formatMacro(current.carbsG)} · {t('onboarding.fat')} {formatMacro(current.fatG)}
          </Text>
          {current.belowSafetyFloor === 1 && (
            <Text style={[styles.warning, { color: colors.danger }]} accessibilityRole="alert">
              {t('goals.belowFloorNote')}
            </Text>
          )}
        </View>
      )}

      <SelectGroup
        label={t('goals.method')}
        options={methodOptions}
        value={method}
        onChange={setMethod}
      />

      {method === 'manual' ? (
        <>
          <NumberField label={t('goals.kcal')} value={kcal} onChangeText={setKcal} />
          <NumberField
            label={t('goals.protein')}
            value={protein}
            onChangeText={setProtein}
            optional
          />
          <NumberField label={t('goals.carbs')} value={carbs} onChangeText={setCarbs} optional />
          <NumberField label={t('goals.fat')} value={fat} onChangeText={setFat} optional />

          {/* SPEC-003 §6 — 0 g de protéines : autorisé, mais signalé. On informe, on ne bloque pas. */}
          {kcalValue !== null && kcalValue > 0 && proteinG === 0 && (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('onboarding.zeroProtein')}
            </Text>
          )}

          {coherence !== null && !coherence.isCoherent && (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('goals.coherenceHint', {
                actual: String(Math.round(coherence.kcalFromMacros)),
                delta: String(Math.abs(Math.round(coherence.deltaKcal))),
                suggested: String(coherence.suggestedCarbsG),
              })}
            </Text>
          )}
        </>
      ) : plan !== null ? (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.bigValue, { color: colors.accent }]}>
            {formatKcal(plan.target.kcal)} kcal
          </Text>
          <Text style={[styles.macros, { color: colors.textMuted }]}>
            {t('onboarding.protein')} {formatMacro(plan.macros.proteinG)} · {t('onboarding.carbs')}{' '}
            {formatMacro(plan.macros.carbsG)} · {t('onboarding.fat')}{' '}
            {formatMacro(plan.macros.fatG)}
          </Text>
          {plan.target.wasRaisedToFloor && (
            <Text style={[styles.warning, { color: colors.danger }]} accessibilityRole="alert">
              {t('onboarding.safetyWarning', { floor: String(plan.target.floorKcal) })}
            </Text>
          )}
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t('goals.missingProfile')}</Text>
      )}

      {error !== null && (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Pressable
        onPress={method === 'manual' ? onSubmitManual : onSubmitCalculated}
        disabled={method === 'calculated' && plan === null}
        accessibilityRole="button"
        accessibilityState={{ disabled: method === 'calculated' && plan === null }}
        style={[
          styles.submit,
          {
            backgroundColor:
              method === 'manual' || plan !== null ? colors.accent : colors.surfaceMuted,
          },
        ]}
      >
        <Text
          style={[
            styles.submitLabel,
            { color: method === 'manual' || plan !== null ? colors.onAccent : colors.textFaint },
          ]}
        >
          {method === 'manual' ? t('common.save') : t('goals.recalculate')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: typography.title,
  bigValue: { ...typography.display, fontVariant: ['tabular-nums'] },
  macros: typography.label,
  hint: typography.label,
  warning: typography.label,
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
