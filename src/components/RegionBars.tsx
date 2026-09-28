import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Item = { key: string; label: string; value: number | null; display: string };

type Props = { items: Item[]; highlight: string | null; onPress: (key: string) => void };

// Ranked horizontal bars; one value label per row doubles as the table view.
export function RegionBars({ items, highlight, onPress }: Props) {
  const max = Math.max(...items.map((i) => i.value ?? 0), 1);
  const sorted = [...items].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return (
    <View style={{ gap: 2 }}>
      {sorted.map((i) => {
        const active = i.key === highlight;
        return (
          <Pressable key={i.key} onPress={() => onPress(i.key)} style={[styles.row, active && styles.rowActive]} accessibilityLabel={`${i.label} ${i.display}`}>
            <Text style={[styles.label, active && styles.bold]}>{i.label}</Text>
            <View style={styles.track}>
              {i.value !== null && (
                <View style={[styles.bar, { width: `${(i.value / max) * 100}%`, backgroundColor: active ? colors.series1 : '#9cc0ec' }]} />
              )}
            </View>
            <Text style={[styles.value, i.value === null && styles.missing, active && styles.bold]}>{i.display}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 6 },
  rowActive: { backgroundColor: '#eef4fc' },
  label: { width: 38, fontSize: 13, color: colors.textPrimary },
  track: { flex: 1, height: 14, justifyContent: 'center' },
  bar: { height: 14, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  value: { width: 70, textAlign: 'right', fontSize: 13, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  missing: { color: colors.textMuted, fontSize: 12 },
  bold: { fontWeight: '700' },
});
