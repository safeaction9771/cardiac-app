import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GuideScreen } from './src/screens/GuideScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { colors } from './src/theme';

type Tab = 'guide' | 'stats';
const TABS: { key: Tab; label: string }[] = [
  { key: 'guide', label: '응급 대처' },
  { key: 'stats', label: '지역 통계' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('guide');
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>{tab === 'guide' ? <GuideScreen /> : <StatsScreen />}</View>
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                <View style={[styles.dot, active && { backgroundColor: t.key === 'guide' ? colors.accent : colors.series1 }]} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  tabText: { fontSize: 14, color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },
});
