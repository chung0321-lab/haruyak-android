import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { shift, slots, toggleDose } from '@/lib/store';
import { useHaru } from '@/contexts/HaruContext';
import { useColors } from '@/hooks/useColors';
import { Background, BOTTOM_PAD, Btn, Card, EmptyState, Progress, ScreenHeader, Skeleton, WEEKDAYS, fmtDate, koDate, parseDate, useTopPad } from '@/components/Haru';
import { DoseRow } from '@/components/DoseRow';

const RANGES = [7, 30, 90];

export default function HistoryScreen() {
  const c = useColors();
  const top = useTopPad();
  const { db, todayStr, run } = useHaru();
  const [sel, setSel] = useState(todayStr);
  const [month, setMonth] = useState(() => todayStr.slice(0, 7));
  const [range, setRange] = useState(30);

  const cells = useMemo(() => {
    const first = parseDate(`${month}-01`);
    const lead = first.getDay();
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const arr: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= count; i++) arr.push(fmtDate(new Date(first.getFullYear(), first.getMonth(), i)));
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [month]);

  const dayStat = (d: string) => {
    if (!db) return { total: 0, done: 0 };
    const l = slots(db, d);
    return { total: l.length, done: l.filter((s) => !!db.checks[s.key]).length };
  };

  const stats = useMemo(() => {
    if (!db) return null;
    let total = 0;
    let done = 0;
    let perfect = 0;
    const per: Record<string, { name: string; total: number; done: number }> = {};
    for (let i = 0; i < range; i++) {
      const d = shift(todayStr, -i);
      const l = slots(db, d);
      let dd = 0;
      for (const s of l) {
        const ok = !!db.checks[s.key];
        total++;
        if (ok) { done++; dd++; }
        per[s.m.id] = per[s.m.id] ?? { name: s.m.name, total: 0, done: 0 };
        per[s.m.id].total++;
        if (ok) per[s.m.id].done++;
      }
      if (l.length && dd === l.length) perfect++;
    }
    return { total, done, perfect, per: Object.values(per) };
  }, [db, range, todayStr]);

  const list = db ? slots(db, sel) : [];
  const m = parseDate(`${month}-01`);
  const moveMonth = (n: number) => setMonth(fmtDate(new Date(m.getFullYear(), m.getMonth() + n, 1)).slice(0, 7));
  const pct = stats && stats.total ? Math.round((stats.done / stats.total) * 1000) / 10 : 0;

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingHorizontal: 14, paddingBottom: BOTTOM_PAD }}>
        <ScreenHeader eyebrow="LOOKING BACK, GENTLY" title="복약 기록" />

        <Card>
          <View style={s.monthRow}>
            <Btn small kind="ghost" icon="chevron-left" onPress={() => moveMonth(-1)} testID="prev-month" />
            <Text style={[s.month, { color: c.foreground }]}>{m.getFullYear()}년 {m.getMonth() + 1}월</Text>
            <Btn small kind="ghost" icon="chevron-right" onPress={() => moveMonth(1)} testID="next-month" />
          </View>
          <View style={s.grid}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={[s.wd, { color: c.mutedForeground }]}>{w}</Text>
            ))}
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={s.cell} />;
              const st = dayStat(d);
              const selected = d === sel;
              const complete = st.total > 0 && st.done === st.total && d <= todayStr;
              const partial = st.done > 0 && !complete;
              return (
                <Pressable
                  key={d}
                  testID={`cal-${d}`}
                  onPress={() => setSel(d)}
                  style={[
                    s.cell,
                    s.cellBox,
                    { backgroundColor: selected ? c.primary : complete ? c.completeDay : partial ? c.partialDay : c.rowPeach, borderColor: d === todayStr ? c.todayMark : 'transparent' },
                  ]}
                >
                  <Text style={[s.cellN, { color: selected ? c.primaryForeground : c.foreground }]}>{parseDate(d).getDate()}</Text>
                  <Text style={[s.cellS, { color: selected ? c.primaryForeground : c.mutedForeground }]}>{st.total ? `${st.done}/${st.total}` : ''}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={s.legend}>
            {[[c.completeDay, '모두 완료'], [c.partialDay, '일부'], [c.rowPeach, '기록 없음']].map(([col, t]) => (
              <View key={t} style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: col }]} />
                <Text style={[s.legendText, { color: c.mutedForeground }]}>{t}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={[s.h2, { color: c.foreground }]}>{koDate(sel, true)}</Text>
        {!db ? (
          <Skeleton />
        ) : list.length === 0 ? (
          <EmptyState title="이 날은 일정이 없어요" body="다른 날짜를 눌러 기록을 확인해 보세요." />
        ) : (
          list.map((slot, i) => (
            <DoseRow key={slot.key} slot={slot} index={i} done={!!db.checks[slot.key]} future={sel > todayStr} onToggle={() => run(() => toggleDose(slot.key))} />
          ))
        )}

        <View style={s.rangeRow}>
          <Text style={[s.h2, { color: c.foreground, flex: 1, marginTop: 0 }]}>통계</Text>
          {RANGES.map((r) => (
            <Btn key={r} small kind={r === range ? 'primary' : 'soft'} label={`${r}일`} onPress={() => setRange(r)} testID={`range-${r}`} />
          ))}
        </View>
        {stats && (
          <>
            <View style={s.statRow}>
              <View style={[s.stat, { backgroundColor: c.secondary }]}>
                <Text style={[s.statN, { color: c.primary }]}>{pct}%</Text>
                <Text style={[s.statL, { color: c.mutedForeground }]}>완료율 · {stats.done}/{stats.total}</Text>
              </View>
              <View style={[s.stat, { backgroundColor: c.backgroundPeach }]}>
                <Text style={[s.statN, { color: c.primary }]}>{stats.perfect}일</Text>
                <Text style={[s.statL, { color: c.mutedForeground }]}>모두 챙긴 날</Text>
              </View>
            </View>
            {stats.per.map((p) => (
              <Card key={p.name + p.total} style={{ paddingVertical: 12 }}>
                <View style={s.perRow}>
                  <Text numberOfLines={1} style={[s.perName, { color: c.foreground }]}>{p.name}</Text>
                  <Text style={[s.perN, { color: c.secondaryForeground }]}>{p.done}/{p.total}</Text>
                </View>
                <Progress value={p.total ? p.done / p.total : 0} height={6} />
              </Card>
            ))}
            <Text style={[s.note, { color: c.mutedForeground }]}>오늘까지의 예정 횟수를 기준으로 계산해요. 아직 체크하지 않은 오늘 일정도 포함돼요.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  month: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wd: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, marginBottom: 4 },
  cell: { width: `${100 / 7}%`, height: 50, padding: 2 },
  cellBox: { borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cellN: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  cellS: { fontFamily: 'Inter_500Medium', fontSize: 9 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  h2: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 14, marginBottom: 4 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18, marginBottom: 6 },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center' },
  statN: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8 },
  statL: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4 },
  perRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  perName: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14 },
  perN: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8, lineHeight: 16 },
});
