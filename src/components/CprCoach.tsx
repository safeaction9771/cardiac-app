import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const BPM = 110; // middle of the 100–120/min guideline range
const INTERVAL = 60000 / BPM;

// Chest-compression pacer: a pulsing circle and a vibration on every beat, counting 1–30.
export function CprCoach() {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const startedAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    activateKeepAwakeAsync('cpr').catch(() => {});
    const beat = setInterval(() => {
      setCount((c) => (c % 30) + 1);
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      scale.setValue(0.82);
      Animated.timing(scale, { toValue: 1, duration: INTERVAL * 0.8, useNativeDriver: Platform.OS !== 'web' }).start();
    }, INTERVAL);
    return () => {
      clearInterval(beat);
      deactivateKeepAwake('cpr').catch(() => {});
    };
  }, [running, scale]);

  const toggle = () => {
    if (!running) {
      setCount(0);
      setElapsed(0);
    }
    setRunning(!running);
  };

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={running ? '가슴압박 박자 멈추기' : '가슴압박 박자 시작'}>
        <Animated.View style={[styles.circle, running && styles.circleOn, { transform: [{ scale }] }]}>
          {running ? (
            <>
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.sub}>/ 30</Text>
            </>
          ) : (
            <>
              <Text style={styles.start}>시작</Text>
              <Text style={styles.sub}>분당 {BPM}회</Text>
            </>
          )}
        </Animated.View>
      </Pressable>
      <Text style={styles.caption}>
        {running
          ? `${mm}:${ss} 경과 · 원이 줄어들 때마다 세게 누르세요${elapsed >= 120 ? '\n2분이 지났어요. 도와줄 사람이 있으면 교대하세요.' : ''}`
          : '누르면 박자에 맞춰 진동하고 화면이 꺼지지 않아요.'}
      </Text>
      {running && (
        <Pressable onPress={toggle} style={styles.stop} accessibilityRole="button">
          <Text style={styles.stopText}>멈추기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  circle: { width: 168, height: 168, borderRadius: 84, backgroundColor: colors.card, borderWidth: 6, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  circleOn: { backgroundColor: colors.accent },
  count: { fontSize: 56, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  start: { fontSize: 30, fontWeight: '800', color: colors.accent },
  sub: { fontSize: 13, color: colors.textMuted },
  caption: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  stop: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  stopText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
});
