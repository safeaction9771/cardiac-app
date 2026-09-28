import { Platform } from 'react-native';

// 국립중앙의료원 전국 AED 정보 조회 서비스 (공공데이터포털). 응답은 XML이며 거리순으로 정렬되어 옵니다.
const ENDPOINT = 'https://apis.data.go.kr/B552657/AEDInfoInqireService/getAedLcinfoInqire';

export type Aed = {
  place: string; // 설치 기관
  spot: string; // 건물 안 설치 위치
  address: string;
  lat: number;
  lon: number;
  distanceKm: number | null;
  tel: string;
  count: number; // 같은 건물에 설치된 AED 대수
};

export const AED_KEY = process.env.EXPO_PUBLIC_AED_SERVICE_KEY ?? '';

function decode(s: string) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : '';
}

// 웹(또는 키 없이 만든 앱)은 scripts/build-aed-data.mjs가 만든 정적 격자 파일에서 찾습니다.
// 웹에 키를 넣으면 누구나 볼 수 있고, AED API는 브라우저 직접 호출(CORS)도 막기 때문입니다.
const TILE_HOST = 'https://safeaction9771.github.io/cardiac-app/aed/';
type TileRow = [string, string, string, number, number, string];

function tileBase() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // 개발 서버는 public/ 파일을 baseUrl 없이 루트에서 내보냅니다.
    if (__DEV__) return `${window.location.origin}/aed/`;
    return new URL('aed/', window.location.origin + window.location.pathname.replace(/[^/]*$/, '')).href;
  }
  return TILE_HOST;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function groupByBuilding(list: Aed[], count: number) {
  const groups = new Map<string, Aed>();
  for (const aed of list) {
    const key = `${aed.place}|${aed.address}`;
    const prev = groups.get(key);
    if (prev) prev.count += 1;
    else groups.set(key, { ...aed });
  }
  return [...groups.values()].slice(0, count);
}

async function fetchNearbyFromTiles(lat: number, lon: number, count: number): Promise<Aed[]> {
  const base = tileBase();
  const la = Math.floor(lat * 10);
  const lo = Math.floor(lon * 10);
  const keys: string[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) keys.push(`${la + dy}_${lo + dx}`);
  const tiles = await Promise.all(
    keys.map(async (k) => {
      const res = await fetch(`${base}${k}.json`);
      // AED가 없는 격자(바다 등)는 파일이 없어서 404나 앱 첫 화면 HTML이 옵니다.
      if (res.status === 404 || !(res.headers.get('content-type') ?? '').includes('json')) return [] as TileRow[];
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as TileRow[];
    }),
  );
  const list: Aed[] = tiles.flat().map(([place, spot, address, aLat, aLon, tel]) => ({
    place, spot, address, lat: aLat, lon: aLon, tel, count: 1,
    distanceKm: distanceKm(lat, lon, aLat, aLon),
  }));
  list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return groupByBuilding(list, count);
}

// 시청처럼 한 건물에 AED가 여러 대면 목록이 한 곳으로만 채워지므로, 넉넉히 받아 건물별로 묶습니다.
export async function fetchNearbyAeds(lat: number, lon: number, count = 5): Promise<Aed[]> {
  if (Platform.OS === 'web' || !AED_KEY) return fetchNearbyFromTiles(lat, lon, count);
  const url = `${ENDPOINT}?serviceKey=${encodeURIComponent(AED_KEY)}&WGS84_LAT=${lat}&WGS84_LON=${lon}&pageNo=1&numOfRows=${count * 8}`;
  const res = await fetch(url);
  const xml = await res.text();
  const code = tag(xml, 'resultCode');
  if (!res.ok || (code && code !== '00')) {
    throw new Error(tag(xml, 'resultMsg') || tag(xml, 'returnAuthMsg') || `HTTP ${res.status}`);
  }
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const list = items.map((it): Aed => {
    const d = parseFloat(tag(it, 'distance'));
    return {
      place: tag(it, 'org'),
      spot: tag(it, 'buildPlace'),
      address: tag(it, 'buildAddress'),
      lat: parseFloat(tag(it, 'wgs84Lat')),
      lon: parseFloat(tag(it, 'wgs84Lon')),
      distanceKm: Number.isFinite(d) ? d : null,
      tel: tag(it, 'clerkTel'),
      count: 1,
    };
  });
  return groupByBuilding(list, count);
}

export function mapUrl(a: Aed) {
  return `https://map.kakao.com/link/map/${encodeURIComponent(a.place || 'AED')},${a.lat},${a.lon}`;
}

export function formatDistance(km: number | null) {
  if (km === null) return '';
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
