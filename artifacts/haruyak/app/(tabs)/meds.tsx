import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteMedication, type Medication } from '@/lib/store';
import { useHaru } from '@/contexts/HaruContext';
import { useColors } from '@/hooks/useColors';
import { Background, BOTTOM_PAD, Btn, EmptyState, ScreenHeader, Skeleton, WEEKDAYS, koDate, rowTint, useTopPad } from '@/components/Haru';

function daysText(d: number[]) {
  if (d.length === 7) return '매일';
  const s = [...d].sort().join(',');
  if (s === '1,2,3,4,5') return '평일';
  if (s === '0,6') return '주말';
  return [...d].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((x) => WEEKDAYS[x]).join(' ');
}

export default function MedsScreen() {
  const c = useColors();
  const top = useTopPad();
  const { db, todayStr, run, confirm } = useHaru();

  const status = (m: Medication) => (m.end && m.end < todayStr ? 'ended' : m.start > todayStr ? 'upcoming' : 'active');
  const meds = db ? [...db.meds].sort((a, b) => (status(a) === 'ended' ? 1 : 0) - (status(b) === 'ended' ? 1 : 0)) : [];

  const remove = async (m: Medication) => {
    const yes = await confirm({ title: `${m.name} 삭제`, message: '약 일정을 삭제해요. 지난 체크 기록은 그대로 남아요.', confirmLabel: '삭제', destructive: true });
    if (yes) await run(() => deleteMedication(m.id), '삭제했어요');
  };

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingHorizontal: 14, paddingBottom: BOTTOM_PAD }}>
        <ScreenHeader eyebrow="MY MEDICINE SHELF" title="내 약 관리" right={<Btn kind="primary" icon="plus" label="약 등록" small onPress={() => router.push('/medication')} testID="meds-add" />} />
        <Text style={[s.lead, { color: c.mutedForeground }]}>{db ? `등록한 약 ${db.meds.length}개` : '불러오는 중'}</Text>
        {!db ? (
          <>
            <Skeleton h={90} />
            <Skeleton h={90} />
          </>
        ) : meds.length === 0 ? (
          <EmptyState title="약 서랍이 비어 있어요" body="약 이름, 복용량, 시점과 요일을 등록해 두면 매일 체크할 수 있어요." action={<Btn kind="primary" icon="plus" label="약 등록하기" onPress={() => router.push('/medication')} />} />
        ) : (
          meds.map((m, i) => {
            const st = status(m);
            const t = rowTint(i, c);
            return (
              <Pressable
                key={m.id}
                testID={`med-${m.id}`}
                onPress={() => router.push({ pathname: '/medication', params: { id: m.id } })}
                style={({ pressed }) => [s.card, { backgroundColor: t.bg, borderColor: c.border, borderLeftColor: t.edge, opacity: st === 'ended' ? 0.6 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
              >
                <View style={s.top}>
                  <Text numberOfLines={1} style={[s.name, { color: c.foreground }]}>{m.name}</Text>
                  <View style={[s.badge, { backgroundColor: st === 'active' ? c.white : c.muted, borderColor: c.border }]}>
                    <Text style={[s.badgeText, { color: c.secondaryForeground }]}>{st === 'active' ? '복용 중' : st === 'upcoming' ? '시작 전' : '종료'}</Text>
                  </View>
                </View>
                <Text style={[s.meta, { color: c.softText }]}>{m.dose} · {daysText(m.days)}</Text>
                <View style={s.times}>
                  {m.times.map((t2) => (
                    <View key={t2} style={[s.time, { backgroundColor: c.white, borderColor: c.border }]}>
                      <Feather name="clock" size={10} color={c.brand} />
                      <Text style={[s.timeText, { color: c.secondaryForeground }]}>{t2}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.period, { color: c.mutedForeground }]}>
                  {koDate(m.start)} 부터{m.end ? ` ${koDate(m.end)} 까지` : ' · 종료일 없음'}
                </Text>
                {!!m.note && <Text style={[s.note, { color: c.mutedForeground }]} numberOfLines={2}>{m.note}</Text>}
                <View style={s.actions}>
                  <Btn small icon="edit-2" label="수정" onPress={() => router.push({ pathname: '/medication', params: { id: m.id } })} />
                  <Btn small kind="danger" icon="trash-2" label="삭제" onPress={() => remove(m)} testID={`delete-${m.id}`} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 6 },
  card: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 18, padding: 14, marginVertical: 5 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.3 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  meta: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 4 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  timeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  period: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10, justifyContent: 'flex-end' },
});
