import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/ui/theme';

type Props = {
  title: string;
  message: string;
};

/** Écran d'attente d'un jalon non encore livré. Sera supprimé au fil des jalons. */
export function ScreenPlaceholder({ title, message }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: typography.title,
  message: { ...typography.body, textAlign: 'center' },
});
