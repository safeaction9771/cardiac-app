import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  selected: T | null;
  onChange: (v: T) => void;
  activeColor?: string;
};

// Horizontally scrolling single-select chips (years, regions).
export function Chips<T extends string | number>({ options, selected, onChange, activeColor = colors.textPrimary }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingVertical: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  label: { fontSize: 13, color: colors.textSecondary },
  labelActive: { color: '#fff', fontWeight: '600' },
});
