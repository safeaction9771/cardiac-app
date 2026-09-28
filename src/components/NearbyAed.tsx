import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Aed, fetchNearbyAeds, formatDistance, mapUrl } from '../aed';
import { colors } from '../theme';

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; items: Aed[] } | { kind: 'error'; message: string };

export function NearbyAed() {
  const [state, setState] = useState<State>({ kind: 'idle' });

  const find = async () => {
    setState({ kind: 'loading' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setState({ kind: 'error', message: '위치 권한이 없어 주변 AED를 찾을 수 없습니다. 설정에서 위치 권한을 허용해 주세요.' });
        return;
      }
      const last = await Location.getLastKnownPositionAsync({ maxAge: 60000 }).catch(() => null);
      const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const items = await fetchNearbyAeds(pos.coords.latitude, pos.coords.longitude);
      setState({ kind: 'done', items });
    } catch (e) {
      setState({ kind: 'error', message: `주변 AED를 불러오지 못했습니다. (${e instanceof Error ? e.message : String(e)})` });
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable style={styles.button} onPress={find} disabled={state.kind === 'loading'} accessibilityRole="button">
        <Text style={styles.buttonText}>{state.kind === 'done' ? '다시 찾기' : '내 주변 AED 찾기'}</Text>
      </Pressable>
      {state.kind === 'loading' && <ActivityIndicator color={colors.series1} />}
      {state.kind === 'error' && <Text style={styles.error}>{state.message}</Text>}
      {state.kind === 'done' && state.items.length === 0 && <Text style={styles.error}>근처에 등록된 AED가 없습니다.</Text>}
      {state.kind === 'done' &&
        state.items.map((a, i) => (
          <Pressable key={`${a.lat},${a.lon},${i}`} style={styles.item} onPress={() => Linking.openURL(mapUrl(a)).catch(() => {})} accessibilityRole="link">
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.place}>
                {a.place}
                {a.count > 1 && <Text style={styles.count}>  AED {a.count}대</Text>}
              </Text>
              {!!a.spot && <Text style={styles.spot}>{a.count > 1 ? `${a.spot} 외 ${a.count - 1}곳` : a.spot}</Text>}
              <Text style={styles.addr}>{a.address}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.dist}>{formatDistance(a.distanceKm)}</Text>
              <Text style={styles.map}>지도</Text>
            </View>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.series1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  item: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.grid },
  place: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  count: { fontSize: 12, fontWeight: '600', color: colors.series1 },
  spot: { fontSize: 13, color: colors.textPrimary },
  addr: { fontSize: 12, color: colors.textMuted },
  dist: { fontSize: 15, fontWeight: '700', color: colors.series1, fontVariant: ['tabular-nums'] },
  map: { fontSize: 12, color: colors.series1 },
});
