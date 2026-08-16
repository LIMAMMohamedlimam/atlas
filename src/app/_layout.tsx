import { useEffect } from 'react';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/lib/i18n';
import { useDatabase } from '@/data/use-database';
import { useOnboardingStatus } from '@/features/onboarding/hooks/use-onboarding-status';
import { spacing, typography, useTheme } from '@/ui/theme';

/**
 * Redirige vers l'onboarding tant qu'il n'est pas terminé, sauf si l'on s'y
 * trouve déjà. Attend que la navigation et la lecture du réglage soient prêtes
 * pour ne jamais faire clignoter l'onboarding à un utilisateur déjà configuré.
 *
 * Composant et non hook de la racine : il ne doit être monté QU'UNE FOIS LA BASE
 * PRÊTE. Sur une installation neuve, `app_settings` n'existe pas encore pendant
 * les migrations ; la live query échouerait, et comme plus rien n'écrit ensuite
 * dans cette table, l'écouteur de changement ne la relancerait jamais —
 * l'onboarding ne s'afficherait alors pas du tout.
 */
const OnboardingRedirect = (): null => {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { ready, complete } = useOnboardingStatus();

  useEffect(() => {
    if (!navigationState?.key || !ready || complete) return;
    if (segments[0] !== 'onboarding') router.replace('/onboarding');
  }, [navigationState?.key, ready, complete, segments]);

  return null;
};

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const { t } = useTranslation();
  const database = useDatabase();

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {database.state === 'ready' ? (
        <>
          <OnboardingRedirect />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen
              name="onboarding/manual"
              options={{
                headerShown: true,
                title: t('onboarding.manualPath'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
            <Stack.Screen
              name="onboarding/assisted"
              options={{
                headerShown: true,
                title: t('onboarding.assistedPath'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
            <Stack.Screen
              name="food/new"
              options={{
                headerShown: true,
                title: t('food.newTitle'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
            <Stack.Screen
              name="diary/add"
              options={{
                headerShown: true,
                title: t('diary.addTitle'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
            <Stack.Screen
              name="diary/edit"
              options={{
                headerShown: true,
                title: t('diary.editTitle'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
            <Stack.Screen
              name="goals"
              options={{
                headerShown: true,
                title: t('goals.title'),
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.accent,
              }}
            />
          </Stack>
        </>
      ) : (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          {database.state === 'migrating' ? (
            <>
              <ActivityIndicator color={colors.accent} />
              <Text style={[styles.message, { color: colors.textMuted }]}>{t('db.migrating')}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.danger }]} accessibilityRole="header">
                {t('db.error')}
              </Text>
              <Text style={[styles.message, { color: colors.textMuted }]}>{t('db.errorHint')}</Text>
            </>
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: typography.title,
  message: { ...typography.body, textAlign: 'center' },
});
