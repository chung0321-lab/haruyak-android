import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { reorderDose, shift, slots, toggleDose } from '@/lib/store';
import { useHaru } from '@/contexts/HaruContext';
import { useColors } from '@/hooks/useColors';
import { Background, BOTTOM_PAD, Btn, EmptyState, PillIcon, Progress, ScreenHeader, Skeleton, WEEKDAYS, fmtDate, koDate, parseDate, styles as hs, useTopPad } from '@/components/Haru';
import { DoseRow } from '@/components/DoseRow';

export default function TodayScreen() {
  const c = useColors();
  const top = useTopPad();
  const { db, todayStr, loadError, reload, run } = useHaru();
  const [sel, setSel] = useState<string>(todayStr);
  const [editing, setEditing] = useState(false);
  const prevToday = useRef(todayStr);

  // follow the date when midnight passes and the user was looking at "today"
  useEffect(() => {
    if (prevToday.current !== todayStr) {
      setSel((s) => (s === prevToday.current ? todayStr : s));
      prevToday.current = todayStr;
    }
  }, [todayStr]);

  const week = useMemo(() => {
    const d = parseDate(sel);
    const mondayOffset = (d.getDay() + 6) % 7;
    const start = fmtDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - mondayOffset));
    return Array.from({ length: 7 }, (_, i) => shift(start, i));
  }, [sel]);

  const list = useMemo(() => (db ? slots(db, sel) : []), [db, sel]);
  const done = db ? list.filter((s) => !!db.checks[s.key]).length : 0;
  const future = sel > todayStr;
  const weekStats = useMemo(
    () =>
      week.map((d) => {
        if (!db) return { total: 0, done: 0 };
        const l = slots(db, d);
        return { total: l.length, done: l.filter((s) => !!db.checks[s.key]).length };
      }),
    [db, week],
  );
  const wd = parseDate(week[0]);
  const isToday = sel === todayStr;

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingHorizontal: 14, paddingBottom: BOTTOM_PAD }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="A LITTLE CARE, EVERY DAY"
          title="혜진의 하루약"
          right={<View style={[s.logo, { backgroundColor: c.white, borderColor: c.border }]}><PillIcon size={30} /></View>}
        />

        <View style={s.weekRow}>
          <Text style={[s.weekLabel, { color: c.softText }]}>{wd.getFullYear()}년 {wd.getMonth() + 1}월</Text>
          <View style={s.tools}>
            <Btn small kind="ghost" icon="chevron-left" onPress={() => setSel(shift(sel, -7))} testID="prev-week" />
            <Btn small kind={isToday ? 'soft' : 'ghost'} label="오늘" onPress={() => setSel(todayStr)} testID="go-today" />
            <Btn small kind="ghost" icon="chevron-right" onPress={() => setSel(shift(sel, 7))} testID="next-week" />
          </View>
        </View>

        <View style={s.strip}>
          {week.map((d, i) => {
            const st = weekStats[i];
            const selected = d === sel;
            const complete = st.total > 0 && st.done === st.total;
            const tintBg = i % 3 === 1 ? c.partialDay : i % 3 === 2 ? c.rowSky : c.card;
            return (
              <Pressable
                key={d}
                testID={`day-${d}`}
                onPress={() => setSel(d)}
                style={[
                  s.day,
                  { backgroundColor: selected ? c.primary : complete ? c.completeDay : tintBg, borderColor: selected ? c.primary : complete ? c.completeDayBorder : c.border },
                  selected && { transform: [{ translateY: -2 }] },
                ]}
              >
                <Text style={[s.dayW, { color: selected ? c.primaryForeground : c.mutedForeground }]}>{WEEKDAYS[parseDate(d).getDay()]}</Text>
                <Text style={[s.dayN, { color: selected ? c.primaryForeground : c.foreground }]}>{parseDate(d).getDate()}</Text>
                <Text style={[s.dayW, { color: selected ? c.primaryForeground : c.mutedForeground }]}>{st.total ? `${st.done}/${st.total}` : ' '}</Text>
                {d === todayStr && <View style={[s.todayBar, { backgroundColor: c.todayMark }]} />}
              </Pressable>
            );
          })}
        </View>

        <LinearGradient colors={[c.heroFrom, c.heroMid, c.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { borderColor: c.heroBorder }]}>
          <Feather name="sun" size={74} color={c.flower} style={s.heroDeco} />
          <View style={{ width: '100%' }}>
            <Text style={[s.heroLabel, { color: c.softText }]}>{isToday ? '오늘 · ' : ''}{koDate(sel)}</Text>
            <Text style={[s.big, { color: c.softText }]}>
              {list.length ? `${done} / ${list.length}회` : '일정 없음'}
            </Text>
            <Text style={[s.heroSub, { color: c.mutedForeground }]}>
              {!list.length ? '이 날은 챙길 약이 없어요' : done === list.length ? '모두 챙겼어요. 잘했어요, 혜진' : future ? '아직 오지 않은 날이에요' : `${list.length - done}회 남았어요`}
            </Text>
          </View>
          <View style={{ width: '100%', marginTop: 10 }}>
            <Progress value={list.length ? done / list.length : 0} />
          </View>
        </LinearGradient>

        <View style={hs.sectionRow}>
          <Text style={[hs.h2, { color: c.foreground, flex: 1 }]}>{isToday ? '오늘 먹을 약' : '이 날의 약'}</Text>
          {list.length > 1 && (
            <Btn small kind={editing ? 'primary' : 'soft'} icon={editing ? 'check' : 'list'} label={editing ? '완료' : '순서 편집'} onPress={() => setEditing((e) => !e)} testID="edit-order" />
          )}
          <Btn small kind="primary" icon="plus" label="약 등록" onPress={() => router.push('/medication')} testID="add-med" />
        </View>

        {loadError && !db ? (
          <EmptyState title="기록을 불러오지 못했어요" body={loadError} action={<Btn label="다시 시도" icon="refresh-cw" onPress={reload} />} />
        ) : !db ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : list.length === 0 ? (
          <EmptyState
            title={db.meds.length ? '이 날은 쉬어가는 날' : '아직 등록한 약이 없어요'}
            body={db.meds.length ? '요일이나 기간에 맞는 일정이 없어요.' : '처방받은 약을 등록하면 하루 일정이 여기에 차곡차곡 쌓여요.'}
            action={!db.meds.length ? <Btn kind="primary" icon="plus" label="첫 약 등록하기" onPress={() => router.push('/medication')} /> : undefined}
          />
        ) : (
          list.map((slot, i) => (
            <DoseRow
              key={slot.key}
              slot={slot}
              index={i}
              done={!!db.checks[slot.key]}
              future={future}
              editing={editing}
              isFirst={i === 0}
              isLast={i === list.length - 1}
              onToggle={() => run(() => toggleDose(slot.key))}
              onOpen={() => router.push({ pathname: '/medication', params: { id: slot.m.id } })}
              onMove={(d) => run(() => reorderDose(slot.key, i + d))}
            />
          ))
        )}

        <Text style={[s.foot, { color: c.mutedForeground }]}>
          {editing ? '화살표로 순서를 바꾸면 모든 날에 같은 순서로 보여요.' : '약 이름을 누르면 수정할 수 있어요 · 미래의 약은 체크할 수 없어요 · 알람 없음'}
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  logo: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  weekLabel: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  tools: { flexDirection: 'row', gap: 5 },
  strip: { flexDirection: 'row', gap: 5, marginTop: 8, marginBottom: 4 },
  day: { flex: 1, minHeight: 64, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, overflow: 'hidden' },
  dayW: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  dayN: { fontFamily: 'Inter_700Bold', fontSize: 18, marginVertical: 1 },
  todayBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 15, marginTop: 8, marginBottom: 4, overflow: 'hidden', flexDirection: 'column' },
  heroDeco: { position: 'absolute', right: 10, top: -8, opacity: 0.55, transform: [{ rotate: '15deg' }] },
  heroLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  big: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8, marginTop: 4 },
  heroSub: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  foot: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 10, lineHeight: 16 },
});
