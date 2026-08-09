import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/lib/i18n';
import { useDatabase } from '@/data/use-database';
import { spacing, typography, useTheme } from '@/ui/theme';

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const { t } = useTranslation();
  const database = useDatabase();

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {database.state === 'ready' ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
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
