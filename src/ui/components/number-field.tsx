import { StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/ui/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  optional?: boolean;
};

/**
 * Champ de saisie numérique (clavier décimal). La valeur reste une CHAÎNE :
 * le composant n'interprète rien, la conversion/validation a lieu à la
 * soumission, jamais au fil de la frappe.
 */
export function NumberField({ label, value, onChangeText, placeholder, optional }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: optional ? colors.textFaint : colors.textMuted }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType="decimal-pad"
        inputMode="decimal"
        accessibilityLabel={label}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: typography.label,
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
});
