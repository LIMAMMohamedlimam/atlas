import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/ui/theme';

export type SelectOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

type Props<T extends string> = {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Groupe d'options sélectionnables (sexe, niveau d'activité, objectif…).
 * Rien n'est porté par la seule couleur : l'état sélectionné est aussi exposé
 * par `accessibilityState`.
 */
export function SelectGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.optionLabel, { color: selected ? colors.onAccent : colors.text }]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: typography.label,
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: typography.label,
});
