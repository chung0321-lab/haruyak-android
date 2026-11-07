import React from 'react';
import { FlexWidget, ImageWidget, ListWidget, TextWidget, WidgetInfo } from 'react-native-android-widget';
import { Database, nextDose, slots, today } from '../lib/model';

const C = {
  ink: '#4c3c61', muted: '#796d87', primary: '#7957a9', peach: '#ffe3d4',
  lilac: '#eee3ff', card: '#fff9f3', done: '#fff0cb', white: '#ffffff',
} as const;
export function MedicationWidget({ db, info, error }: { db: Database; info: WidgetInfo; error?: string }) {
  const day = today();
  const list = slots(db, day);
  const completed = list.filter(s => db.checks[s.key]).length;
  const small = info.widgetName === 'HaruSmall';
  const next = nextDose(db);
  const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const updated = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <FlexWidget style={{
      width: 'match_parent', height: 'match_parent', padding: small ? 10 : 8,
      borderRadius: 24, backgroundGradient: { from: C.peach, to: C.lilac, orientation: 'TL_BR' },
    }}>
      {small && <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <ImageWidget image={require('../assets/images/icon.png')} imageWidth={small ? 20 : 26} imageHeight={small ? 20 : 26} clickAction="OPEN_APP" accessibilityLabel="하루약 앱 열기" />
        <TextWidget text="혜진의 하루약" style={{ fontSize: small ? 11 : 17, fontWeight: 'bold', color: C.ink, marginLeft: 6 }} clickAction="OPEN_APP" />
      </FlexWidget>}
      {small && <TextWidget text={dateLabel} style={{ fontSize: 10, color: C.muted, marginTop: 4 }} />}
      {small && <TextWidget text={`${completed} / ${list.length}회 완료`} style={{ fontSize: 20, fontWeight: 'bold', color: C.primary, marginTop: 3 }} />}
      {error ? (
        <TextWidget text={error} maxLines={3} clickAction="REFRESH" accessibilityLabel="오류 발생. 눌러서 다시 시도"
          style={{ fontSize: 12, color: '#a83434', marginTop: 6 }} />
      ) : small ? (
        <FlexWidget style={{ flex: 1, width: 'match_parent', justifyContent: 'center' }} clickAction="OPEN_APP">
          <TextWidget text={next ? `다음 · ${next.t}` : list.length ? '오늘 일정 모두 완료' : '오늘 복용 일정 없음'} maxLines={2} style={{ fontSize: 12, fontWeight: 'bold', color: C.ink }} />
          <TextWidget text={next ? next.m.name : '앱에서 일정을 관리하세요'} maxLines={1} truncate="END" style={{ fontSize: 11, color: C.muted, marginTop: 3 }} />
        </FlexWidget>
      ) : list.length ? (
        <ListWidget style={{ height: Math.max(44, info.height - 16), width: 'match_parent' }}>
          {list.map((s, index) => {
            const done = !!db.checks[s.key];
            return (
              <FlexWidget key={s.key} style={{
                width: 'match_parent', flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, borderRadius: 12,
                backgroundColor: done ? C.done : index % 2 ? '#f8f4ff' : C.card,
              }}>
                <FlexWidget style={{ flex: 1 }} clickAction="OPEN_APP">
                  <TextWidget text={s.m.name} maxLines={1} truncate="END" style={{ fontSize: 13, color: C.ink, fontWeight: 'bold' }} />
                  <TextWidget text={`${s.t} · ${s.m.dose}`} maxLines={1} truncate="END" style={{ fontSize: 11, color: C.muted, marginTop: 2 }} />
                </FlexWidget>
                <TextWidget text={done ? '완료 · 취소' : '복용 체크'} clickAction="SET_DOSE"
                  clickActionData={{ key: s.key, day, completed: !done }}
                  accessibilityLabel={`${s.m.name} ${s.t} ${done ? '복용 취소' : '복용 완료'}`}
                  style={{ fontSize: 11, color: done ? '#755823' : C.white, backgroundColor: done ? '#f5e8bd' : C.primary,
                    borderRadius: 10, paddingHorizontal: 9, height: 44 }} />
              </FlexWidget>
            );
          })}
        </ListWidget>
      ) : (
        <TextWidget text="오늘 먹을 약이 없어요. 앱에서 약을 등록해 주세요." style={{ fontSize: 13, color: C.muted, marginTop: 16 }} clickAction="OPEN_APP" />
      )}
      {small && <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
        <TextWidget text={`${updated} 갱신`} style={{ fontSize: 9, color: C.muted }} />
        <TextWidget text="새로고침" clickAction="REFRESH" accessibilityLabel="오늘 일정 새로고침"
          style={{ fontSize: small ? 10 : 11, color: C.primary, padding: small ? 5 : 7, backgroundColor: '#ffffffbb', borderRadius: 9 }} />
      </FlexWidget>}
    </FlexWidget>
  );
}
