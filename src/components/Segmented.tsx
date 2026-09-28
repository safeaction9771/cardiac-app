import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string | number>({ options, selected, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: colors.grid, borderRadius: 10, padding: 3 },
  item: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  itemActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  label: { fontSize: 14, color: colors.textSecondary },
  labelActive: { color: colors.textPrimary, fontWeight: '600' },
});
