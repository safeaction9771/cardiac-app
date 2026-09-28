import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

export type Series = { name: string; color: string; values: (number | null)[] };

type Props = { years: number[]; series: Series[]; format: (v: number | null) => string };

const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function niceMax(v: number) {
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / step) * step;
}

// Line chart over years; null values break the line. Tap a year to read values.
export function TrendChart({ years, series, format }: Props) {
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState(years.length - 1);
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const yMax = niceMax(Math.max(...all, 1));
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (years.length === 1 ? plotW / 2 : (i / (years.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const path = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i)},${y(v)}`;
      pen = true;
    });
    return d;
  };

  return (
    <View>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
        {width > 0 && (
          <Svg width={width} height={H}>
            {ticks.map((t) => (
              <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.grid} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={y(t) + 4} fontSize={10} fill={colors.textMuted} textAnchor="end">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </SvgText>
            ))}
            <Line x1={x(sel)} x2={x(sel)} y1={PAD.top} y2={PAD.top + plotH} stroke={colors.textMuted} strokeWidth={1} strokeDasharray="3,3" />
            {years.map((yr, i) => (
              <SvgText key={yr} x={x(i)} y={H - 8} fontSize={10} fill={i === sel ? colors.textPrimary : colors.textMuted} fontWeight={i === sel ? '700' : '400'} textAnchor="middle">
                {`'${String(yr).slice(2)}`}
              </SvgText>
            ))}
            {series.map((s) => (
              <Path key={s.name} d={path(s.values)} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" />
            ))}
            {series.map((s) =>
              s.values.map((v, i) =>
                v === null ? null : (
                  <Circle key={`${s.name}${i}`} cx={x(i)} cy={y(v)} r={i === sel ? 5 : 3} fill={s.color} stroke={colors.card} strokeWidth={2} />
                ),
              ),
            )}
          </Svg>
        )}
        {/* Invisible hit columns, wider than the marks */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', left: PAD.left - plotW / (years.length - 1) / 2, right: PAD.right - plotW / (years.length - 1) / 2 }]}>
          {years.map((yr, i) => (
            <Pressable key={yr} style={{ flex: 1 }} onPress={() => setSel(i)} accessibilityLabel={`${yr}년`} />
          ))}
        </View>
      </View>
      <View style={styles.readout}>
        <Text style={styles.readoutYear}>{years[sel]}년</Text>
        {series.map((s) => (
          <View key={s.name} style={styles.readoutItem}>
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={styles.readoutText}>{s.name} </Text>
            <Text style={[styles.readoutText, styles.bold]}>{format(s.values[sel])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 6 },
  readoutYear: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  readoutItem: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 10, height: 10, borderRadius: 2, marginRight: 5 },
  readoutText: { fontSize: 13, color: colors.textSecondary },
  bold: { fontWeight: '700', color: colors.textPrimary },
});
