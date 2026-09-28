# 급성심장정지 통계 앱 (프로토타입)

보건복지부 급성심장정지 시도별 통계(2016–2023)의 발생률·생존율·뇌기능 회복률을 연도·지역별 차트로 보는 Expo(React Native) 앱입니다.

## 실행
```bash
npm install
npx expo start        # 휴대폰의 Expo Go 앱으로 QR 코드 스캔
npx expo start --web  # 브라우저에서 보기
```

## 데이터
- 원본 CSV(CP949) → `../data/*.csv`(UTF-8) → `../data/clean.mjs` → `src/data/cardiac.json`
- 데이터를 바꾸면 `node clean.mjs` 후 `cardiac.json`을 `src/data/`에 다시 복사하세요.
- 빈 칸(비공개 값)은 `null`이며 앱에서 '자료 없음'으로 표시됩니다.

## 구조
- `App.tsx` 메인 화면 (지표·원인·조율/표준화율 선택, 지역 비교 / 연도별 추이)
- `src/components/` 막대그래프, 추이 차트, 선택 버튼
- `src/data.ts` 데이터 조회 헬퍼

## 내 주변 AED 찾기
공공데이터포털 "국립중앙의료원_전국 자동심장충격기(AED) 정보 조회 서비스" 인증키가 필요합니다.
`.env.example`을 `.env.local`로 복사하고 `EXPO_PUBLIC_AED_SERVICE_KEY`에 키를 넣으세요. `.env.local`은 git에 올라가지 않습니다.
주의: `EXPO_PUBLIC_` 값은 앱 안에 포함되므로, 앱을 배포하면 키를 추출할 수 있습니다. 정식 출시 전에는 서버를 거쳐 호출하도록 바꾸는 것이 좋습니다.
