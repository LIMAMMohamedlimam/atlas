import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/ui/theme';

/** Premier écran de l'onboarding : choix du chemin (SPEC-003 §3). */
export default function OnboardingWelcomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {t('onboarding.welcome')}
      </Text>

      <View
        style={[
          styles.disclaimer,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          {t('onboarding.disclaimer')}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/onboarding/manual')}
        accessibilityRole="button"
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('onboarding.manualPath')}</Text>
        <Text style={[styles.cardHint, { color: colors.textMuted }]}>
          {t('onboarding.manualPathHint')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/onboarding/assisted')}
        accessibilityRole="button"
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t('onboarding.assistedPath')}
        </Text>
        <Text style={[styles.cardHint, { color: colors.textMuted }]}>
          {t('onboarding.assistedPathHint')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  title: typography.display,
  disclaimer: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  disclaimerText: typography.body,
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: typography.title,
  cardHint: typography.body,
});
