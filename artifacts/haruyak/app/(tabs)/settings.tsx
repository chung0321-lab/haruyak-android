import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { restoreDatabase, slots, nextDose, validateBackup, type Database } from '@/lib/store';
import { pickBackup, shareBackup } from '@/lib/backup';
import { refreshWidgets } from '@/lib/widget-refresh';
import { errorText, useHaru } from '@/contexts/HaruContext';
import { useColors } from '@/hooks/useColors';
import { Background, BOTTOM_PAD, Btn, Card, PillIcon, Progress, ScreenHeader, useTopPad } from '@/components/Haru';

const SAMPLE = `{
  "version": 1,
  "meds": [{ "id": "m1", "name": "아침 약", "dose": "1정",
    "note": "", "start": "2025-01-01", "end": "",
    "days": [0,1,2,3,4,5,6], "times": ["아침 식후 · 08:00"] }],
  "checks": { "2025-01-02|m1|아침 식후 · 08:00": "2025-01-02T08:03:00" },
  "order": ["m1|아침 식후 · 08:00"]
}`;

export default function SettingsScreen() {
  const c = useColors();
  const top = useTopPad();
  const { db, todayStr, run, toast, confirm } = useHaru();
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);

  const list = db ? slots(db, todayStr) : [];
  const doneN = db ? list.filter((s) => !!db.checks[s.key]).length : 0;
  const next = db ? nextDose(db, todayStr) : undefined;

  const applyIncoming = async (incoming: Database) => {
    const yes = await confirm({
      title: '현재 기록을 바꿀까요?',
      message: `백업에는 약 ${incoming.meds.length}개, 체크 기록 ${Object.keys(incoming.checks).length}개가 있어요.\n지금 기록(약 ${db?.meds.length ?? 0}개, 체크 ${db ? Object.keys(db.checks).length : 0}개)은 모두 이 내용으로 바뀌어요.`,
      confirmLabel: '복원하기',
      destructive: true,
    });
    if (!yes) return;
    const ok = await run(() => restoreDatabase(incoming), '백업을 복원했어요');
    if (ok) setPaste('');
  };

  const fromFile = async () => {
    setBusy(true);
    try {
      const incoming = await pickBackup();
      if (incoming) await applyIncoming(incoming);
    } catch (e) {
      toast(`백업 파일을 읽지 못했어요: ${errorText(e)}`, 'error');
    }
    setBusy(false);
  };

  const fromPaste = async () => {
    let incoming: Database;
    try {
      incoming = validateBackup(JSON.parse(paste));
    } catch (e) {
      toast(`올바른 백업 JSON이 아니에요: ${errorText(e)}`, 'error');
      return;
    }
    await applyIncoming(incoming);
  };

  const exportIt = async () => {
    setBusy(true);
    try {
      await shareBackup();
      toast('백업 파일을 만들었어요');
    } catch (e) {
      toast(`백업에 실패했어요: ${errorText(e)}`, 'error');
    }
    setBusy(false);
  };

  const refresh = async () => {
    try {
      await refreshWidgets();
      toast('위젯을 새로 그렸어요');
    } catch (e) {
      toast(`위젯 갱신 실패: ${errorText(e)}`, 'error');
    }
  };

  const steps = [
    'Expo Go에서는 위젯을 설치할 수 없어요. 빌드한 APK를 설치해 주세요.',
    '갤럭시 홈 화면 빈 곳을 길게 누르세요.',
    '위젯 > 혜진의 하루약 을 고르세요.',
    '작은 위젯 또는 큰 위젯을 골라 추가하세요.',
    '위젯을 길게 눌러 테두리를 끌면 크기를 바꿀 수 있어요.',
  ];

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingHorizontal: 14, paddingBottom: BOTTOM_PAD }} keyboardShouldPersistTaps="handled">
        <ScreenHeader eyebrow="HOME SCREEN & KEEPSAKE" title="위젯 · 백업" />

        <Text style={[s.h2, { color: c.foreground }]}>홈 화면 위젯</Text>
        <View style={[s.previewTag, { backgroundColor: c.accent }]}>
          <Feather name="eye" size={12} color={c.accentForeground} />
          <Text style={[s.previewTagText, { color: c.accentForeground }]}>미리보기 · 실제 위젯은 Android 홈 화면에 표시돼요</Text>
        </View>

        <View style={s.previewRow}>
          <View style={[s.wSmall, { backgroundColor: c.widgetBg, borderColor: c.heroBorder }]}>
            <View style={s.wHead}>
              <PillIcon size={18} />
              <Text style={[s.wTitle, { color: c.brand }]}>하루약</Text>
            </View>
            <Text style={[s.wBig, { color: c.foreground }]}>{list.length ? `${doneN}/${list.length}` : '0'}</Text>
            <Progress value={list.length ? doneN / list.length : 0} height={5} />
            <Text numberOfLines={2} style={[s.wNext, { color: c.mutedForeground }]}>
              {!list.length ? '오늘 일정 없음' : next ? `다음 · ${next.t} ${next.m.name}` : '모두 챙겼어요'}
            </Text>
            <Text style={[s.wLabel, { color: c.mutedForeground }]}>작은 위젯</Text>
          </View>

          <View style={[s.wLarge, { backgroundColor: c.widgetBg, borderColor: c.heroBorder }]}>
            {list.length === 0 ? (
              <Text style={[s.wNext, { color: c.mutedForeground }]}>오늘 챙길 약이 없어요</Text>
            ) : (
              list.slice(0, 4).map((sl) => {
                const d = db ? !!db.checks[sl.key] : false;
                return (
                  <View key={sl.key} style={[s.wRow, { backgroundColor: d ? c.doneBg : c.rowLilac }]}>
                    <Text numberOfLines={1} style={[s.wRowText, { color: c.cardForeground }]}>{sl.m.name} · {sl.t}</Text>
                    <View style={[s.wChk, { backgroundColor: d ? c.doneButton : c.primary }]}>
                      <Text style={[s.wChkText, { color: d ? c.doneButtonText : c.primaryForeground }]}>{d ? '취소' : '먹음'}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <Card>
          <Text style={[s.h3, { color: c.foreground }]}>위젯 추가하는 방법</Text>
          {steps.map((t, i) => (
            <View key={t} style={s.step}>
              <View style={[s.stepN, { backgroundColor: c.secondary }]}>
                <Text style={[s.stepNText, { color: c.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[s.body, { color: c.softText }]}>{t}</Text>
            </View>
          ))}
          <Btn icon="refresh-cw" label="위젯 새로고침" onPress={refresh} style={{ marginTop: 10 }} testID="refresh-widgets" />
        </Card>

        <Text style={[s.h2, { color: c.foreground }]}>내 기록 보관</Text>
        <Card>
          <Text style={[s.body, { color: c.softText }]}>기록은 이 기기 안에만 저장돼요. 휴대폰을 바꾸거나 앱을 지우기 전에는 꼭 백업해 주세요.</Text>
          <Text style={[s.meta, { color: c.mutedForeground }]}>
            지금 약 {db?.meds.length ?? 0}개 · 체크 기록 {db ? Object.keys(db.checks).length : 0}개
          </Text>
          <Btn kind="primary" icon="download" label="JSON 백업 내보내기" onPress={exportIt} disabled={busy} testID="export" />
        </Card>

        <Card>
          <Text style={[s.h3, { color: c.foreground }]}>백업 복원</Text>
          <Text style={[s.body, { color: c.softText }]}>혜진의 하루약(원래 HTML 버전 포함)에서 받은 JSON 백업을 고르세요. 복원 전에 개수를 확인해 드려요.</Text>
          <Btn icon="upload" label="백업 파일 선택" onPress={fromFile} disabled={busy} style={{ marginTop: 10 }} testID="import-file" />
          <Text style={[s.label, { color: c.brand }]}>또는 JSON 붙여넣기</Text>
          <TextInput
            testID="paste-json"
            value={paste}
            onChangeText={setPaste}
            multiline
            placeholder={'{ "version": 1, "meds": [...], ... }'}
            placeholderTextColor={c.mutedForeground}
            style={[s.paste, { borderColor: c.input, backgroundColor: c.white, color: c.cardForeground }]}
          />
          <Btn label="붙여넣은 내용으로 복원" icon="corner-down-left" onPress={fromPaste} disabled={!paste.trim()} style={{ marginTop: 8 }} testID="import-paste" />
          <Text style={[s.label, { color: c.brand }]}>백업 형식 예시</Text>
          <View style={[s.code, { backgroundColor: c.muted }]}>
            <Text style={[s.codeText, { color: c.secondaryForeground }]}>{SAMPLE}</Text>
          </View>
        </Card>

        <View style={[s.notice, { backgroundColor: c.notice }]}>
          <Feather name="info" size={14} color={c.noticeText} />
          <Text style={[s.body, { color: c.noticeText, flex: 1 }]}>서버 연결, 로그인, 알람이 없는 개인 기록장이에요. 처방된 용법을 그대로 입력하세요.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  h2: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 14, marginBottom: 6 },
  h3: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  meta: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginVertical: 10 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 14, marginBottom: 6 },
  previewTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  previewTagText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  previewRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  wSmall: { width: 130, borderRadius: 22, borderWidth: 1, padding: 12, gap: 6 },
  wLarge: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 12, gap: 5 },
  wHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wTitle: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  wBig: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -1 },
  wNext: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  wLabel: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 4, opacity: 0.8 },
  wRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, paddingLeft: 7, paddingVertical: 3, paddingRight: 3, gap: 4 },
  wRowText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  wChk: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  wChkText: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  stepN: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  paste: { borderWidth: 1, borderRadius: 13, minHeight: 90, padding: 10, fontFamily: 'Inter_400Regular', fontSize: 12, textAlignVertical: 'top' },
  code: { borderRadius: 12, padding: 10 },
  codeText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, marginTop: 12, alignItems: 'flex-start' },
});
