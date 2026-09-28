import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CprCoach } from '../components/CprCoach';
import { NearbyAed } from '../components/NearbyAed';
import { colors } from '../theme';

// Steps follow the Korean CPR guideline for lay rescuers (2020).
const CPR_STEPS: { title: string; body: string }[] = [
  { title: '반응 확인', body: '어깨를 두드리며 "괜찮으세요?" 하고 크게 불러봅니다.' },
  { title: '119 신고와 AED 요청', body: '반응이 없으면 주변의 한 사람을 지목해 119 신고를, 다른 사람에게 AED(자동심장충격기)를 가져오도록 부탁합니다. 혼자라면 스피커폰으로 119에 전화하세요.' },
  { title: '호흡 확인', body: '10초 안에 가슴이 오르내리는지 봅니다. 숨을 쉬지 않거나 헐떡이듯 비정상적으로 쉬면 심정지로 판단합니다.' },
  { title: '가슴압박 30회', body: '가슴 한가운데(가슴뼈 아래쪽 절반)에 두 손을 겹쳐 올리고, 팔을 곧게 펴서 약 5cm 깊이로 분당 100–120회 속도로 누릅니다. 누른 뒤에는 가슴이 완전히 올라오게 합니다.' },
  { title: '인공호흡 2회 (교육받은 경우)', body: '머리를 젖히고 턱을 들어 기도를 연 뒤 2회 불어넣습니다. 자신이 없으면 인공호흡 없이 가슴압박만 계속해도 됩니다.' },
  { title: '멈추지 말고 반복', body: 'AED가 도착하거나 구급대원이 올 때까지, 또는 환자가 움직이거나 정상적으로 숨을 쉴 때까지 계속합니다.' },
];

const AED_STEPS = [
  '전원 버튼을 누르거나 뚜껑을 엽니다. 이후 음성 안내를 따릅니다.',
  '패드 하나는 오른쪽 쇄골 바로 아래, 다른 하나는 왼쪽 젖꼭지 아래 옆구리에 붙입니다.',
  '"분석 중"이라고 하면 환자에게서 모두 손을 뗍니다.',
  '충격이 필요하다고 하면 모두 떨어진 것을 확인하고 깜박이는 충격 버튼을 누릅니다.',
  '충격 후 또는 "충격이 필요 없다"고 하면 바로 가슴압박을 다시 시작합니다. AED는 2분마다 다시 분석합니다.',
];

export function GuideScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>쓰러진 사람을 봤다면</Text>
      <Text style={styles.lead}>심장이 멈추면 4–5분 안에 뇌 손상이 시작됩니다. 구급차가 오기 전, 옆에 있는 사람이 시작하는 가슴압박이 생존을 좌우합니다.</Text>

      <Pressable style={styles.call} onPress={() => Linking.openURL('tel:119').catch(() => {})} accessibilityRole="button">
        <Text style={styles.callText}>119 전화하기</Text>
        <Text style={styles.callSub}>상담원이 전화로 가슴압박 방법을 알려줍니다</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>가슴압박 박자 도우미</Text>
        <CprCoach />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>심폐소생술 순서</Text>
        {CPR_STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AED(자동심장충격기) 사용법</Text>
        {AED_STEPS.map((t, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.num, styles.numAed]}><Text style={styles.numText}>{i + 1}</Text></View>
            <Text style={[styles.stepBody, { flex: 1 }]}>{t}</Text>
          </View>
        ))}
        <Text style={styles.note}>AED는 지하철역, 아파트 관리사무소, 공공기관 등에 설치되어 있습니다.</Text>
        <NearbyAed />
      </View>

      <Text style={styles.foot}>
        이 안내는 교육용 요약입니다. 실제 상황에서는 119 상담원의 안내를 따르고, 가까운 소방서나 대한심폐소생협회 교육을 받아두면 좋습니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  call: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 2 },
  callText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  callSub: { fontSize: 13, color: '#ffe3e6' },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numAed: { backgroundColor: colors.series1 },
  numText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  stepBody: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  note: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  foot: { fontSize: 11, lineHeight: 16, color: colors.textMuted },
});
