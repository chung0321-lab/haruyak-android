import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteMedication, saveMedication, shift, validateBackup, type Medication } from '@/lib/store';
import { errorText, useHaru } from '@/contexts/HaruContext';
import { useColors } from '@/hooks/useColors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Background, Btn, Card, PillIcon, WEEKDAYS, useTopPad } from '@/components/Haru';

const PRESETS = ['아침 공복', '아침 식전', '아침 식후', '점심 식전', '점심 식후', '저녁 식전', '저녁 식후', '자기 전'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function newId() {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export default function MedicationScreen() {
  const c = useColors();
  const top = useTopPad();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, todayStr, run, confirm } = useHaru();
  const existing = id && db ? db.meds.find((m) => m.id === id) : undefined;
  const isNew = !id;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [note, setNote] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [moment, setMoment] = useState('');
  const [clock, setClock] = useState('');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [start, setStart] = useState(todayStr);
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inited = useRef<string | null>(null);

  useEffect(() => {
    if (existing && inited.current !== existing.id) {
      inited.current = existing.id;
      setName(existing.name);
      setDose(existing.dose);
      setNote(existing.note ?? '');
      setTimes(existing.times);
      setDays(existing.days);
      setStart(existing.start);
      setEnd(existing.end ?? '');
    }
  }, [existing]);

  const addTime = (raw?: string) => {
    const m = (raw ?? moment).trim();
    const k = raw ? '' : clock.trim();
    if (k && !CLOCK_RE.test(k)) {
      setError('시간은 08:00 처럼 HH:mm 형식으로 입력해 주세요.');
      return;
    }
    const label = m && k ? `${m} · ${k}` : m || k;
    if (!label) {
      setError('복용 시점이나 시간을 입력해 주세요.');
      return;
    }
    if (times.includes(label)) {
      setError('이미 추가된 일정이에요.');
      return;
    }
    setTimes((t) => [...t, label]);
    setMoment('');
    setClock('');
    setError(null);
  };

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()));

  const save = async () => {
    setError(null);
    const med: Medication = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      dose: dose.trim(),
      note: note.trim(),
      start: start.trim(),
      end: end.trim(),
      days,
      times,
    };
    if (!med.name) return setError('약 이름을 입력해 주세요.');
    if (!med.dose) return setError('1회 복용량을 입력해 주세요.');
    if (!med.times.length) return setError('복용 일정을 하나 이상 추가해 주세요.');
    if (!med.days.length) return setError('복용 요일을 하나 이상 골라 주세요.');
    if (!DATE_RE.test(med.start)) return setError('시작일은 YYYY-MM-DD 형식이에요.');
    if (med.end && !DATE_RE.test(med.end)) return setError('종료일은 YYYY-MM-DD 형식이에요.');
    if (med.end && med.end < med.start) return setError('종료일이 시작일보다 빨라요.');
    if (db) {
      try {
        validateBackup({ ...db, meds: [...db.meds.filter((m) => m.id !== med.id), med] });
      } catch (e) {
        return setError(errorText(e));
      }
    }
    setSaving(true);
    const ok = await run(() => saveMedication(med), isNew ? `${med.name} 등록했어요` : '수정을 저장했어요');
    setSaving(false);
    if (ok) router.back();
  };

  const remove = async () => {
    if (!existing) return;
    const yes = await confirm({
      title: `${existing.name} 삭제`,
      message: '약 일정을 삭제해요. 지난 체크 기록은 그대로 남아요.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!yes) return;
    const ok = await run(() => deleteMedication(existing.id), '삭제했어요');
    if (ok) router.back();
  };

  const input = [s.input, { borderColor: c.input, backgroundColor: c.white, color: c.cardForeground }];
  const label = [s.label, { color: c.brand }];

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingTop: top, paddingHorizontal: 16, paddingBottom: 60 }} bottomOffset={20}>
        <View style={s.head}>
          <Pressable testID="close-editor" onPress={() => router.back()} style={[s.close, { backgroundColor: c.secondary }]}>
            <Feather name="x" size={20} color={c.primary} />
          </Pressable>
          <Text style={[s.title, { color: c.foreground }]}>{isNew ? '약 등록' : '약 수정'}</Text>
          <PillIcon size={34} />
        </View>
        {id && db && !existing ? (
          <Card><Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium' }}>이 약을 찾을 수 없어요. 삭제되었을 수 있어요.</Text></Card>
        ) : (
          <>
            <Card>
              <Text style={label}>약 이름 *</Text>
              <TextInput testID="input-name" value={name} onChangeText={setName} maxLength={80} placeholder="예: 아침에 먹는 약" placeholderTextColor={c.mutedForeground} style={input} />
              <Text style={label}>1회 복용량 *</Text>
              <TextInput testID="input-dose" value={dose} onChangeText={setDose} maxLength={80} placeholder="예: 1정" placeholderTextColor={c.mutedForeground} style={input} />
            </Card>

            <Card>
              <Text style={label}>복용 일정 *</Text>
              <View style={s.chips}>
                {times.length === 0 && <Text style={[s.hint, { color: c.mutedForeground }]}>아래에서 시점이나 시간을 추가하세요.</Text>}
                {times.map((t, i) => (
                  <View key={t} style={[s.timeChip, { backgroundColor: c.secondary }]}>
                    <Text style={[s.chipText, { color: c.secondaryForeground }]}>{i + 1}. {t}</Text>
                    <Pressable testID={`remove-time-${i}`} hitSlop={8} onPress={() => setTimes((ts) => ts.filter((x) => x !== t))}>
                      <Feather name="x" size={14} color={c.secondaryForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Text style={[s.mini, { color: c.mutedForeground }]}>자주 쓰는 시점 · 누르면 바로 추가</Text>
              <View style={s.chips}>
                {PRESETS.map((p) => (
                  <Pressable key={p} onPress={() => addTime(p)} style={[s.preset, { borderColor: c.border, backgroundColor: c.rowPeach }]}>
                    <Text style={[s.chipText, { color: c.softText }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.grid}>
                <TextInput value={moment} onChangeText={setMoment} maxLength={30} placeholder="시점 (예: 아침 식후)" placeholderTextColor={c.mutedForeground} style={[input, { flex: 1.4 }]} />
                <TextInput value={clock} onChangeText={setClock} maxLength={5} placeholder="08:00" keyboardType="numbers-and-punctuation" placeholderTextColor={c.mutedForeground} style={[input, { flex: 1 }]} />
              </View>
              <Btn icon="plus" label="이 복용 일정 추가" onPress={() => addTime()} style={{ marginTop: 8 }} testID="add-time" />
            </Card>

            <Card>
              <Text style={label}>복용 요일 *</Text>
              <View style={s.days}>
                {WEEKDAYS.map((w, d) => {
                  const on = days.includes(d);
                  return (
                    <Pressable key={w} testID={`day-toggle-${d}`} onPress={() => toggleDay(d)} style={[s.dayBtn, { backgroundColor: on ? c.primary : c.muted }]}>
                      <Text style={[s.dayText, { color: on ? c.primaryForeground : c.secondaryForeground }]}>{w}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={s.quick}>
                <Btn small label="매일" onPress={() => setDays([0, 1, 2, 3, 4, 5, 6])} />
                <Btn small label="평일" onPress={() => setDays([1, 2, 3, 4, 5])} />
                <Btn small label="주말" onPress={() => setDays([0, 6])} />
              </View>
              <View style={s.grid}>
                <View style={{ flex: 1 }}>
                  <Text style={label}>시작일 *</Text>
                  <TextInput testID="input-start" value={start} onChangeText={setStart} maxLength={10} placeholder="YYYY-MM-DD" placeholderTextColor={c.mutedForeground} style={input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={label}>종료일 (선택)</Text>
                  <TextInput testID="input-end" value={end} onChangeText={setEnd} maxLength={10} placeholder="계속 복용" placeholderTextColor={c.mutedForeground} style={input} />
                </View>
              </View>
              <View style={s.quick}>
                <Btn small label="오늘 시작" onPress={() => setStart(todayStr)} />
                <Btn small label="7일분" onPress={() => setEnd(shift(start || todayStr, 6))} />
                <Btn small label="30일분" onPress={() => setEnd(shift(start || todayStr, 29))} />
                <Btn small label="종료일 없음" onPress={() => setEnd('')} />
              </View>
            </Card>

            <Card>
              <Text style={label}>메모 (선택)</Text>
              <TextInput testID="input-note" value={note} onChangeText={setNote} maxLength={300} multiline placeholder="예: 우유와 함께 먹지 않기" placeholderTextColor={c.mutedForeground} style={[input, { minHeight: 80, textAlignVertical: 'top' }]} />
              <Text style={[s.mini, { color: c.mutedForeground }]}>처방된 용법을 그대로 적어 주세요. 이 기록장은 복용량을 추천하지 않아요.</Text>
            </Card>

            {error && (
              <View style={[s.err, { backgroundColor: c.destructiveSoft }]}>
                <Feather name="alert-circle" size={16} color={c.destructive} />
                <Text style={[s.errText, { color: c.destructive }]}>{error}</Text>
              </View>
            )}
            <Btn kind="primary" icon="check" label={saving ? '저장하는 중...' : '저장하기'} disabled={saving} onPress={save} style={{ marginTop: 10, minHeight: 50 }} testID="save-med" />
            {existing && <Btn kind="danger" icon="trash-2" label="이 약 삭제" onPress={remove} style={{ marginTop: 8 }} testID="delete-med" />}
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  close: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.8 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_500Medium', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  preset: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  mini: { fontFamily: 'Inter_400Regular', fontSize: 11, marginVertical: 6, lineHeight: 16 },
  grid: { flexDirection: 'row', gap: 8 },
  days: { flexDirection: 'row', gap: 5 },
  dayBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  err: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 13, marginTop: 8 },
  errText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
});
