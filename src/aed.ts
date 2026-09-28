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

// 시청처럼 한 건물에 AED가 여러 대면 목록이 한 곳으로만 채워지므로, 넉넉히 받아 건물별로 묶습니다.
export async function fetchNearbyAeds(lat: number, lon: number, count = 5): Promise<Aed[]> {
  if (!AED_KEY) throw new Error('AED 인증키가 설정되지 않았습니다.');
  const url = `${ENDPOINT}?serviceKey=${encodeURIComponent(AED_KEY)}&WGS84_LAT=${lat}&WGS84_LON=${lon}&pageNo=1&numOfRows=${count * 8}`;
  const res = await fetch(url);
  const xml = await res.text();
  const code = tag(xml, 'resultCode');
  if (!res.ok || (code && code !== '00')) {
    throw new Error(tag(xml, 'resultMsg') || tag(xml, 'returnAuthMsg') || `HTTP ${res.status}`);
  }
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const groups = new Map<string, Aed>();
  for (const it of items) {
    const d = parseFloat(tag(it, 'distance'));
    const aed: Aed = {
      place: tag(it, 'org'),
      spot: tag(it, 'buildPlace'),
      address: tag(it, 'buildAddress'),
      lat: parseFloat(tag(it, 'wgs84Lat')),
      lon: parseFloat(tag(it, 'wgs84Lon')),
      distanceKm: Number.isFinite(d) ? d : null,
      tel: tag(it, 'clerkTel'),
      count: 1,
    };
    const key = `${aed.place}|${aed.address}`;
    const prev = groups.get(key);
    if (prev) prev.count += 1;
    else groups.set(key, aed);
  }
  return [...groups.values()].slice(0, count);
}

export function mapUrl(a: Aed) {
  return `https://map.kakao.com/link/map/${encodeURIComponent(a.place || 'AED')},${a.lat},${a.lon}`;
}

export function formatDistance(km: number | null) {
  if (km === null) return '';
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
