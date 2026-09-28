import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chips } from '../components/Chips';
import { RegionBars } from '../components/RegionBars';
import { Segmented } from '../components/Segmented';
import { TrendChart } from '../components/TrendChart';
import { CauseKey, INDICATOR_KEYS, IndicatorKey, MEASURE_LABEL, Measure, cell, data, formatValue, value } from '../data';
import { colors } from '../theme';

const DESCRIPTIONS: Record<IndicatorKey, string> = {
  incidence: '인구 10만 명당 급성심장정지 발생자 수',
  survival: '급성심장정지 환자 중 생존하여 퇴원한 비율',
  brainRecovery: '급성심장정지 환자 중 뇌기능이 회복된 상태로 퇴원한 비율',
};

// Crude (unstandardized) rates read as "per 100 people", which is what a general reader expects.
function plainSummary(region: string, year: number) {
  const inc = cell(year, region, 'incidence', 'disease');
  const surv = cell(year, region, 'survival', 'disease')?.rate ?? null;
  const brain = cell(year, region, 'brainRecovery', 'disease')?.rate ?? null;
  if (!inc?.count) return `${year}년 ${region} 자료가 없습니다.`;
  let text = `${year}년 ${region}에서는 질병으로 급성심장정지가 온 사람이 ${inc.count.toLocaleString('ko-KR')}명이었습니다(인구 10만 명당 ${inc.rate}명).`;
  if (surv !== null && brain !== null)
    text += ` 이 중 100명당 약 ${Math.round(surv)}명이 살아서 퇴원했고, 약 ${Math.round(brain)}명은 뇌기능까지 회복했습니다.`;
  else if (surv !== null) text += ` 이 중 100명당 약 ${Math.round(surv)}명이 살아서 퇴원했습니다.`;
  else if (brain !== null) text += ` 이 중 100명당 약 ${Math.round(brain)}명이 뇌기능을 회복해 퇴원했습니다.`;
  return text + ' 쓰러진 사람을 본 즉시 119에 신고하고 가슴압박을 시작하면 살 가능성이 높아집니다.';
}

type Mode = 'regions' | 'trend';
const NONE = '__none__';

export function StatsScreen() {
  const lastYear = data.years[data.years.length - 1];
  const [ind, setInd] = useState<IndicatorKey>('survival');
  const [cause, setCause] = useState<CauseKey>('disease');
  const [measure, setMeasure] = useState<Measure>('std');
  const [mode, setMode] = useState<Mode>('regions');
  const [year, setYear] = useState(lastYear);
  const [region, setRegion] = useState('서울');
  const [compare, setCompare] = useState<string>(NONE);

  const meta = data.indicators[ind];
  const fmt = (v: number | null) => formatValue(v, ind);
  const regionOpts = data.regions.map((r) => ({ value: r.ko, label: r.ko }));

  const barItems = data.regions.map((r) => {
    const v = value(year, r.ko, ind, cause, measure);
    return { key: r.ko, label: r.ko, value: v, display: fmt(v) };
  });
  const series = [region, compare]
    .filter((r) => r !== NONE && r !== undefined)
    .map((r, i) => ({
      name: r,
      color: i === 0 ? colors.series1 : colors.series2,
      values: data.years.map((y) => value(y, r, ind, cause, measure)),
    }));

  return (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>급성심장정지 통계</Text>
          <Text style={styles.subtitle}>시도별 발생률·생존율·뇌기능 회복률 ({data.years[0]}–{lastYear})</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>우리 지역 한눈에 보기</Text>
            <Chips options={regionOpts} selected={region} onChange={setRegion} activeColor={colors.series1} />
            <Text style={styles.plain}>{plainSummary(region, lastYear)}</Text>
          </View>

          <Segmented
            options={INDICATOR_KEYS.map((k) => ({ value: k, label: data.indicators[k].label }))}
            selected={ind}
            onChange={setInd}
          />
          <Text style={styles.desc}>{DESCRIPTIONS[ind]}</Text>

          <View style={styles.filters}>
            <View style={{ flex: 1 }}>
              <Segmented
                options={[{ value: 'disease' as CauseKey, label: '질병' }, { value: 'nonDisease' as CauseKey, label: '질병 외' }]}
                selected={cause}
                onChange={setCause}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Segmented
                options={(['std', 'rate'] as Measure[]).map((m) => ({ value: m, label: MEASURE_LABEL[m] }))}
                selected={measure}
                onChange={setMeasure}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Segmented
              options={[{ value: 'regions' as Mode, label: '지역 비교' }, { value: 'trend' as Mode, label: '연도별 추이' }]}
              selected={mode}
              onChange={setMode}
            />

            {mode === 'regions' ? (
              <>
                <Text style={styles.cardTitle}>
                  {year}년 {data.causes[cause]} {meta.label} ({MEASURE_LABEL[measure]}, {meta.unit})
                </Text>
                <Chips options={[...data.years].reverse().map((y) => ({ value: y, label: `${y}` }))} selected={year} onChange={setYear} />
                <View style={{ height: 8 }} />
                <RegionBars
                  items={barItems}
                  highlight={region}
                  onPress={(r) => {
                    setRegion(r);
                    setMode('trend');
                  }}
                />
                <Text style={styles.hint}>지역을 누르면 연도별 추이를 볼 수 있어요.</Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>
                  {data.causes[cause]} {meta.label} 추이 ({MEASURE_LABEL[measure]}, {meta.unit})
                </Text>
                <Text style={styles.label}>지역</Text>
                <Chips options={regionOpts} selected={region} onChange={setRegion} activeColor={colors.series1} />
                <Text style={styles.label}>비교할 지역</Text>
                <Chips
                  options={[{ value: NONE, label: '없음' }, ...regionOpts.filter((o) => o.value !== region)]}
                  selected={compare}
                  onChange={setCompare}
                  activeColor={compare === NONE ? colors.textPrimary : colors.series2}
                />
                <View style={{ height: 10 }} />
                <TrendChart years={data.years} series={series} format={fmt} />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {region} · {mode === 'regions' ? year : lastYear}년 요약 ({data.causes[cause]})
            </Text>
            {INDICATOR_KEYS.map((k) => {
              const c = cell(mode === 'regions' ? year : lastYear, region, k, cause);
              return (
                <View key={k} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{data.indicators[k].label}</Text>
                  <Text style={styles.summaryValue}>{formatValue(c?.[measure] ?? null, k)}</Text>
                  <Text style={styles.summaryCount}>
                    {data.indicators[k].countLabel} {c?.count != null ? c.count.toLocaleString('ko-KR') : '–'}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.foot}>
            표준화율은 지역 간 연령 구조 차이를 보정한 값입니다. '자료 없음'은 원자료에서 공개되지 않은 값입니다.{'\n'}
            출처: {data.source}
          </Text>
        </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -8 },
  desc: { fontSize: 13, color: colors.textSecondary },
  filters: { flexDirection: 'row', gap: 8 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  plain: { fontSize: 15, lineHeight: 23, color: colors.textPrimary },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.grid },
  summaryLabel: { width: 96, fontSize: 14, color: colors.textSecondary },
  summaryValue: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  summaryCount: { fontSize: 12, color: colors.textMuted },
  foot: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
});
