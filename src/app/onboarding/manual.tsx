import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { appSettingsRepository, nutritionTargetsRepository } from '@/data/repositories';
import { SAFETY_FLOOR_KCAL } from '@/domain/nutrition/energy';
import { checkManualCoherence } from '@/domain/nutrition/macros';
import { ONBOARDING_COMPLETED_KEY } from '@/features/onboarding/hooks/use-onboarding-status';
import { todayLocalDay } from '@/lib/date';
import { parseDecimal } from '@/lib/number';
import { kilocalories } from '@/lib/units';
import { NumberField } from '@/ui/components/number-field';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

/**
 * RG-4 — Ce chemin ne collecte aucune donnée de profil (CA-7), donc le sexe est
 * inconnu : on applique le plancher `unspecified`, exactement comme le fait
 * `calculateTargetKcal` dans le domaine. Retenir le plus bas des trois seuils
 * serait le choix le MOINS protecteur, et ferait diverger l'interface de la
 * règle appliquée ailleurs.
 */
const MIN_FLOOR_KCAL = SAFETY_FLOOR_KCAL.unspecified;

/** Onboarding « je connais mes chiffres » (CA-7) : saisie directe, sans profil stocké. */
export default function OnboardingManualScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const kcalValue = parseDecimal(kcal);
  const proteinG = parseDecimal(protein) ?? 0;
  const carbsG = parseDecimal(carbs) ?? 0;
  const fatG = parseDecimal(fat) ?? 0;

  const coherence =
    kcalValue !== null && kcalValue > 0
      ? checkManualCoherence(kilocalories(kcalValue), { proteinG, carbsG, fatG })
      : null;

  const finish = () => {
    appSettingsRepository.set(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/(tabs)');
  };

  const save = (belowSafetyFloor: boolean) => {
    if (kcalValue === null || kcalValue <= 0) return;
    nutritionTargetsRepository.save({
      effectiveFrom: todayLocalDay(),
      kcal: kcalValue,
      proteinG,
      carbsG,
      fatG,
      method: 'manual',
      belowSafetyFloor,
    });
    finish();
  };

  const onSubmit = () => {
    if (kcalValue === null || kcalValue <= 0) {
      setError(t('food.energyRequired'));
      return;
    }
    // RG-4 — forcer sous le plancher impose une confirmation dédiée.
    if (kcalValue < MIN_FLOOR_KCAL) {
      Alert.alert(t('onboarding.safetyWarning', { floor: String(MIN_FLOOR_KCAL) }), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('onboarding.finish'), onPress: () => save(true) },
      ]);
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
      <NumberField label={t('onboarding.kcal')} value={kcal} onChangeText={setKcal} />
      <NumberField
        label={t('onboarding.protein')}
        value={protein}
        onChangeText={setProtein}
        optional
      />
      <NumberField label={t('onboarding.carbs')} value={carbs} onChangeText={setCarbs} optional />
      <NumberField label={t('onboarding.fat')} value={fat} onChangeText={setFat} optional />

      {coherence !== null && !coherence.isCoherent && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {t('goals.coherenceHint', {
            actual: String(Math.round(coherence.kcalFromMacros)),
            delta: String(Math.abs(Math.round(coherence.deltaKcal))),
            suggested: String(coherence.suggestedCarbsG),
          })}
        </Text>
      )}

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
        <Text style={[styles.submitLabel, { color: colors.onAccent }]}>
          {t('onboarding.finish')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  hint: typography.label,
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
