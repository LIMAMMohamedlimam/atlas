import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  appSettingsRepository,
  bodyMeasurementsRepository,
  nutritionTargetsRepository,
  userProfileRepository,
} from '@/data/repositories';
import {
  GOAL_ADJUSTMENTS,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from '@/domain/nutrition/energy';
import { computeGoalPlan } from '@/domain/nutrition/goals';
import { formatKcal, formatMacro } from '@/features/diary/format';
import { ONBOARDING_COMPLETED_KEY } from '@/features/onboarding/hooks/use-onboarding-status';
import { todayLocalDay } from '@/lib/date';
import { parseDecimal } from '@/lib/number';
import { centimeters, kilograms } from '@/lib/units';
import { NumberField } from '@/ui/components/number-field';
import { SelectGroup, type SelectOption } from '@/ui/components/select-group';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

const CURRENT_YEAR = new Date().getFullYear();

/** Onboarding « aide-moi à les calculer » : profil → BMR → TDEE → objectif. */
export default function OnboardingAssistedScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [birthYear, setBirthYear] = useState('');
  const [sex, setSex] = useState<Sex>('unspecified');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [error, setError] = useState<string | null>(null);

  const birthYearValue = parseDecimal(birthYear);
  const heightCm = parseDecimal(height);
  const weightKg = parseDecimal(weight);

  const isPlausible =
    birthYearValue !== null &&
    birthYearValue >= 1900 &&
    heightCm !== null &&
    heightCm >= 100 &&
    heightCm <= 250 &&
    weightKg !== null &&
    weightKg >= 30 &&
    weightKg <= 300;

  const plan =
    isPlausible && birthYearValue !== null && heightCm !== null && weightKg !== null
      ? computeGoalPlan({
          sex,
          birthYear: Math.round(birthYearValue),
          heightCm: centimeters(heightCm),
          weightKg: kilograms(weightKg),
          activityLevel: activity,
          goalType: goal,
          currentYear: CURRENT_YEAR,
        })
      : null;

  const sexOptions: readonly SelectOption<Sex>[] = [
    { value: 'male', label: t('onboarding.male') },
    { value: 'female', label: t('onboarding.female') },
    { value: 'unspecified', label: t('onboarding.unspecified') },
  ];
  const activityOptions: readonly SelectOption<ActivityLevel>[] = [
    { value: 'sedentary', label: t('onboarding.activity_sedentary') },
    { value: 'light', label: t('onboarding.activity_light') },
    { value: 'moderate', label: t('onboarding.activity_moderate') },
    { value: 'very', label: t('onboarding.activity_very') },
    { value: 'extra', label: t('onboarding.activity_extra') },
  ];
  const goalOptions: readonly SelectOption<GoalType>[] = [
    { value: 'lose_slow', label: t('onboarding.goal_lose_slow') },
    { value: 'lose_moderate', label: t('onboarding.goal_lose_moderate') },
    { value: 'maintain', label: t('onboarding.goal_maintain') },
    { value: 'gain_slow', label: t('onboarding.goal_gain_slow') },
    { value: 'gain_moderate', label: t('onboarding.goal_gain_moderate') },
  ];

  const adjustmentLabel = (goalType: GoalType): string => {
    const pct = Math.round(GOAL_ADJUSTMENTS[goalType] * 100);
    return pct > 0 ? `+${pct} %` : `${pct} %`;
  };

  const finish = () => {
    appSettingsRepository.set(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/(tabs)');
  };

  const onSubmit = () => {
    if (birthYearValue === null || birthYearValue < 1900 || birthYearValue > CURRENT_YEAR) {
      setError(t('onboarding.birthYearInvalid'));
      return;
    }
    if (weightKg === null || weightKg < 30 || weightKg > 300) {
      setError(t('onboarding.weightRange'));
      return;
    }
    if (heightCm === null || heightCm < 100 || heightCm > 250) {
      setError(t('onboarding.heightRange'));
      return;
    }
    if (!plan) return;
    if (!plan.assistedAllowed) {
      setError(t('onboarding.under16'));
      return;
    }

    userProfileRepository.save({
      birthYear: Math.round(birthYearValue),
      sex,
      heightCm,
      activityLevel: activity,
      goalType: goal,
    });
    bodyMeasurementsRepository.save({ day: todayLocalDay(), weightKg });
    nutritionTargetsRepository.save({
      effectiveFrom: todayLocalDay(),
      kcal: plan.target.kcal,
      proteinG: plan.macros.proteinG,
      carbsG: plan.macros.carbsG,
      fatG: plan.macros.fatG,
      method: 'calculated',
      calcBmr: plan.bmr,
      calcTdee: plan.tdee,
      calcAdjustmentPct: GOAL_ADJUSTMENTS[goal],
    });
    finish();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <NumberField
        label={t('onboarding.birthYear')}
        value={birthYear}
        onChangeText={setBirthYear}
        placeholder="1990"
      />
      <View>
        <SelectGroup
          label={t('onboarding.sex')}
          options={sexOptions}
          value={sex}
          onChange={setSex}
        />
        <Text style={[styles.hint, { color: colors.textFaint }]}>{t('onboarding.sexHint')}</Text>
      </View>
      <NumberField
        label={t('onboarding.height')}
        value={height}
        onChangeText={setHeight}
        placeholder="180"
      />
      <NumberField
        label={t('onboarding.weight')}
        value={weight}
        onChangeText={setWeight}
        placeholder="80"
      />
      <SelectGroup
        label={t('onboarding.activity')}
        options={activityOptions}
        value={activity}
        onChange={setActivity}
      />
      <SelectGroup
        label={t('onboarding.goal')}
        options={goalOptions}
        value={goal}
        onChange={setGoal}
      />

      {plan !== null && (
        <View
          style={[styles.recap, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.recapTitle, { color: colors.text }]}>{t('onboarding.recap')}</Text>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.bmr')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.text }]}>
              {formatKcal(plan.bmr)} kcal
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.tdee')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.text }]}>
              {formatKcal(plan.tdee)} kcal
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.adjustment')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.text }]}>{adjustmentLabel(goal)}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.target')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.accent }]}>
              {formatKcal(plan.target.kcal)} kcal
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.protein')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.protein }]}>
              {formatMacro(plan.macros.proteinG)}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.carbs')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.carbs }]}>
              {formatMacro(plan.macros.carbsG)}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.textMuted }]}>
              {t('onboarding.fat')}
            </Text>
            <Text style={[styles.recapValue, { color: colors.fat }]}>
              {formatMacro(plan.macros.fatG)}
            </Text>
          </View>

          {plan.target.wasRaisedToFloor && (
            <Text style={[styles.warning, { color: colors.danger }]} accessibilityRole="alert">
              {t('onboarding.safetyWarning', { floor: String(plan.target.floorKcal) })}
            </Text>
          )}

          {!plan.assistedAllowed && (
            <Text style={[styles.warning, { color: colors.danger }]} accessibilityRole="alert">
              {t('onboarding.under16')}
            </Text>
          )}
        </View>
      )}

      {error !== null && (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={plan === null || !plan.assistedAllowed}
        accessibilityRole="button"
        accessibilityState={{ disabled: plan === null || !plan.assistedAllowed }}
        style={[
          styles.submit,
          {
            backgroundColor:
              plan !== null && plan.assistedAllowed ? colors.accent : colors.surfaceMuted,
          },
        ]}
      >
        <Text
          style={[
            styles.submitLabel,
            { color: plan !== null && plan.assistedAllowed ? colors.onAccent : colors.textFaint },
          ]}
        >
          {t('onboarding.finish')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  hint: typography.label,
  recap: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  recapTitle: typography.title,
  recapRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  recapLabel: typography.label,
  recapValue: typography.mono,
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
