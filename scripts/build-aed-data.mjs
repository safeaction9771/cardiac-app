// 전국 AED 목록을 공공데이터포털(전체 다운로드 API. 목록 조회 API는 세종시가 빠져 있음)에서 받아 0.1도 격자별 JSON 파일(public/aed/)로 나눠 저장합니다.
// 웹 앱은 이 정적 파일에서 가까운 AED를 찾으므로 인증키가 웹에 노출되지 않습니다.
// 실행: node --env-file=.env.local scripts/build-aed-data.mjs  (또는 AED_SERVICE_KEY 환경변수)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const KEY = process.env.AED_SERVICE_KEY || process.env.EXPO_PUBLIC_AED_SERVICE_KEY;
if (!KEY) {
  console.error('AED 인증키가 없습니다 (AED_SERVICE_KEY).');
  process.exit(1);
}
const ENDPOINT = 'https://apis.data.go.kr/B552657/AEDInfoInqireService/getAedFullDown';
const ROWS = 5000;
const OUT = new URL('../public/aed/', import.meta.url);

const decode = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : '';
};

// 전체 다운로드 API의 주소는 대부분 시도·시군구가 빠져 있어서(세종은 들어 있음) 앞에 붙여 줍니다.
function fullAddress(it) {
  const addr = tag(it, 'buildAddress');
  const sido = tag(it, 'sido');
  if (!sido || addr.startsWith(sido)) return addr;
  return [sido, tag(it, 'gugun'), addr].filter(Boolean).join(' ');
}

async function page(no) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${ENDPOINT}?serviceKey=${encodeURIComponent(KEY)}&pageNo=${no}&numOfRows=${ROWS}`);
      const xml = await res.text();
      if (!res.ok || tag(xml, 'resultCode') !== '00') throw new Error(tag(xml, 'resultMsg') || `HTTP ${res.status}`);
      return xml;
    } catch (e) {
      if (attempt >= 4) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const first = await page(1);
const total = Number(tag(first, 'totalCount'));
const pages = Math.ceil(total / ROWS);
const xmls = [first];
for (let no = 2; no <= pages; no++) xmls.push(await page(no));

// 한 격자 파일: [기관, 건물 안 위치, 주소, 위도, 경도, 전화][]
const tiles = new Map();
let kept = 0;
for (const xml of xmls) {
  for (const it of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const lat = parseFloat(tag(it, 'wgs84Lat'));
    const lon = parseFloat(tag(it, 'wgs84Lon'));
    if (!(lat > 32 && lat < 39.5 && lon > 124 && lon < 132)) continue;
    const key = `${Math.floor(lat * 10)}_${Math.floor(lon * 10)}`;
    if (!tiles.has(key)) tiles.set(key, []);
    tiles.get(key).push([tag(it, 'org'), tag(it, 'buildPlace'), fullAddress(it), +lat.toFixed(6), +lon.toFixed(6), tag(it, 'clerkTel')]);
    kept++;
  }
}
if (kept < total * 0.9) throw new Error(`받은 AED가 너무 적습니다 (${kept}/${total}).`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const [key, rows] of tiles) writeFileSync(new URL(`${key}.json`, OUT), JSON.stringify(rows));
writeFileSync(new URL('meta.json', OUT), JSON.stringify({ total: kept, tiles: tiles.size, updated: new Date().toISOString().slice(0, 10) }));
console.log(`AED ${kept}/${total}개, 격자 ${tiles.size}개 저장`);
