import raw from './data/cardiac.json';

export type IndicatorKey = 'incidence' | 'survival' | 'brainRecovery';
export type CauseKey = 'disease' | 'nonDisease';
export type Measure = 'rate' | 'std';

type Cell = { count: number | null; rate: number | null; std: number | null };
type Row = { year: number; region: string } & Record<IndicatorKey, Record<CauseKey, Cell>>;

export const data = raw as unknown as {
  source: string;
  years: number[];
  regions: { ko: string; en: string }[];
  indicators: Record<IndicatorKey, { label: string; unit: string; countLabel: string }>;
  causes: Record<CauseKey, string>;
  rows: Row[];
};

export const INDICATOR_KEYS: IndicatorKey[] = ['incidence', 'survival', 'brainRecovery'];

export const MEASURE_LABEL: Record<Measure, string> = { rate: '조율', std: '표준화율' };

export function cell(year: number, region: string, ind: IndicatorKey, cause: CauseKey): Cell | undefined {
  return data.rows.find((r) => r.year === year && r.region === region)?.[ind][cause];
}

export function value(year: number, region: string, ind: IndicatorKey, cause: CauseKey, m: Measure) {
  return cell(year, region, ind, cause)?.[m] ?? null;
}

export function formatValue(v: number | null, ind: IndicatorKey) {
  if (v === null) return '자료 없음';
  return ind === 'incidence' ? `${v.toFixed(1)}명` : `${v.toFixed(1)}%`;
}
