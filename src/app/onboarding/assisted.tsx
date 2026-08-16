import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { formatKcal } from '@/features/diary/format';
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

  /**
   * Le calcul propose, l'utilisateur dispose : les quatre valeurs du récapitulatif
   * sont modifiables avant validation. Une chaîne vide signifie « non retouché »,
   * donc la valeur calculée fait foi.
   *
   * Toute modification du profil réinitialise ces retouches : garder un objectif
   * saisi pour un poids qui vient de changer produirait un plan incohérent.
   */
  const [overrides, setOverrides] = useState({ kcal: '', protein: '', carbs: '', fat: '' });
  const resetOverrides = () => setOverrides({ kcal: '', protein: '', carbs: '', fat: '' });
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      resetOverrides();
    };

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

  /** Valeurs réellement enregistrées : la retouche si elle existe, sinon le calcul. */
  const effective =
    plan === null
      ? null
      : {
          kcal: parseDecimal(overrides.kcal) ?? plan.target.kcal,
          proteinG: parseDecimal(overrides.protein) ?? plan.macros.proteinG,
          carbsG: parseDecimal(overrides.carbs) ?? plan.macros.carbsG,
          fatG: parseDecimal(overrides.fat) ?? plan.macros.fatG,
        };

  const isEdited =
    plan !== null &&
    effective !== null &&
    (effective.kcal !== plan.target.kcal ||
      effective.proteinG !== plan.macros.proteinG ||
      effective.carbsG !== plan.macros.carbsG ||
      effective.fatG !== plan.macros.fatG);

  /** Affiche la retouche en cours, ou la valeur calculée tant qu'il n'y en a pas. */
  const fieldValue = (override: string, computed: number): string =>
    override !== '' ? override : String(Math.round(computed));

  const belowFloor = plan !== null && effective !== null && effective.kcal < plan.target.floorKcal;

  const adjustmentLabel = (goalType: GoalType): string => {
    const pct = Math.round(GOAL_ADJUSTMENTS[goalType] * 100);
    return pct > 0 ? `+${pct} %` : `${pct} %`;
  };

  const finish = () => {
    appSettingsRepository.set(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/(tabs)');
  };

  const save = (belowSafetyFloor: boolean) => {
    if (plan === null || effective === null) return;
    if (birthYearValue === null || heightCm === null || weightKg === null) return;

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
      kcal: effective.kcal,
      proteinG: effective.proteinG,
      carbsG: effective.carbsG,
      fatG: effective.fatG,
      // Retouché, le chiffre ne sort plus de la formule : le dire honnêtement
      // plutôt que de le présenter comme calculé. La traçabilité du calcul
      // d'origine est conservée ci-dessous quoi qu'il arrive.
      method: isEdited ? 'manual' : 'calculated',
      calcBmr: plan.bmr,
      calcTdee: plan.tdee,
      calcAdjustmentPct: GOAL_ADJUSTMENTS[goal],
      belowSafetyFloor,
    });
    finish();
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
    if (plan === null || effective === null) return;
    if (!plan.assistedAllowed) {
      setError(t('onboarding.under16'));
      return;
    }
    if (effective.kcal <= 0) {
      setError(t('food.energyRequired'));
      return;
    }
    // RG-4 — descendre sous le plancher reste possible, mais jamais par inadvertance.
    if (belowFloor) {
      Alert.alert(
        t('onboarding.safetyWarning', { floor: String(plan.target.floorKcal) }),
        undefined,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('onboarding.finish'), onPress: () => save(true) },
        ],
      );
      return;
    }
    save(false);
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
        onChangeText={withReset(setBirthYear)}
        placeholder="1990"
      />
      <View>
        <SelectGroup
          label={t('onboarding.sex')}
          options={sexOptions}
          value={sex}
          onChange={withReset(setSex)}
        />
        <Text style={[styles.hint, { color: colors.textFaint }]}>{t('onboarding.sexHint')}</Text>
      </View>
      <NumberField
        label={t('onboarding.height')}
        value={height}
        onChangeText={withReset(setHeight)}
        placeholder="180"
      />
      <NumberField
        label={t('onboarding.weight')}
        value={weight}
        onChangeText={withReset(setWeight)}
        placeholder="80"
      />
      <SelectGroup
        label={t('onboarding.activity')}
        options={activityOptions}
        value={activity}
        onChange={withReset(setActivity)}
      />
      <SelectGroup
        label={t('onboarding.goal')}
        options={goalOptions}
        value={goal}
        onChange={withReset(setGoal)}
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
          <Text style={[styles.hint, { color: colors.textFaint }]}>{t('onboarding.editHint')}</Text>

          <NumberField
            label={t('onboarding.target')}
            value={fieldValue(overrides.kcal, plan.target.kcal)}
            onChangeText={(kcal) => setOverrides((o) => ({ ...o, kcal }))}
          />
          <NumberField
            label={t('onboarding.protein')}
            value={fieldValue(overrides.protein, plan.macros.proteinG)}
            onChangeText={(protein) => setOverrides((o) => ({ ...o, protein }))}
          />
          <NumberField
            label={t('onboarding.carbs')}
            value={fieldValue(overrides.carbs, plan.macros.carbsG)}
            onChangeText={(carbs) => setOverrides((o) => ({ ...o, carbs }))}
          />
          <NumberField
            label={t('onboarding.fat')}
            value={fieldValue(overrides.fat, plan.macros.fatG)}
            onChangeText={(fat) => setOverrides((o) => ({ ...o, fat }))}
          />

          {effective !== null && effective.proteinG === 0 && (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('onboarding.zeroProtein')}
            </Text>
          )}

          {(plan.target.wasRaisedToFloor || belowFloor) && (
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
