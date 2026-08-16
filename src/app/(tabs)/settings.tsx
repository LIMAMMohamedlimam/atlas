import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/ui/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const rows: { label: string; value: string }[] = [
    { label: t('settings.database'), value: t('settings.databaseReady') },
    { label: t('settings.version'), value: Constants.expoConfig?.version ?? '—' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Pressable
        onPress={() => router.push('/goals')}
        accessibilityRole="button"
        accessibilityLabel={t('goals.title')}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.linkRow}>
          <Text style={[styles.label, { color: colors.text }]}>{t('goals.title')}</Text>
          <Text style={[styles.chevron, { color: colors.textFaint }]}>›</Text>
        </View>
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{row.label}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  chevron: typography.title,
  row: { paddingVertical: spacing.md, gap: spacing.xs },
  label: typography.label,
  value: typography.body,
});
