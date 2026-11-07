'use no memo';

import React from 'react';
import { FlexWidget, ImageWidget, ListWidget, TextWidget, WidgetInfo } from 'react-native-android-widget';
import { Database, nextDose, slots, today } from '../lib/model';
import { largeWidgetLayout, widgetRows } from './layout';

const C = {
  ink: '#4c3c61', muted: '#796d87', primary: '#7957a9', peach: '#ffe3d4',
  lilac: '#eee3ff', card: '#fff9f3', done: '#fff0cb', white: '#ffffff',
} as const;
export function MedicationWidget({ db, info, error }: { db: Database; info: WidgetInfo; error?: string }) {
  // Headless rendering runs outside React; compiler memo hooks cannot run here.
  'use no memo';
  const day = today();
  const list = slots(db, day);
  const completed = list.filter(s => db.checks[s.key]).length;
  const small = info.widgetName === 'HaruSmall';
  const next = nextDose(db);
  const { contentHeight, rowHeight, rowGap } = largeWidgetLayout(info.height);
  const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const updated = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <FlexWidget style={{
      width: 'match_parent', height: 'match_parent', padding: small ? 10 : 8,
      borderRadius: 24, backgroundColor: C.peach, backgroundGradient: { from: C.peach, to: C.lilac, orientation: 'TL_BR' },
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
        <ListWidget style={{ height: contentHeight, width: 'match_parent' }}>
          {widgetRows(list).map((row, rowIndex) => (
            <FlexWidget key={row[0].key} style={{
              width: 'match_parent', height: rowHeight, flexDirection: 'row',
              marginBottom: rowGap, flexGap: 4,
            }}>
              {row.map((s, column) => {
                const done = !!db.checks[s.key];
                return (
                  <FlexWidget key={s.key} clickAction="SET_DOSE"
                    clickActionData={{ key: s.key, day, completed: !done }}
                    accessibilityLabel={`${rowIndex * 2 + column + 1}. ${s.m.name} ${s.t} ${s.m.dose}. ${done ? '복용 완료, 누르면 취소' : '미복용, 누르면 완료'}`}
                    style={{
                      flex: 1, height: rowHeight, flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 6, borderRadius: 10,
                      backgroundColor: done ? C.done : column ? '#f8f4ff' : C.card,
                    }}>
                    <FlexWidget style={{ flex: 1 }}>
                      <TextWidget text={s.m.name} maxLines={1} truncate="END" allowFontScaling={false}
                        style={{ fontSize: 12, color: C.ink, fontWeight: 'bold' }} />
                      <TextWidget text={`${s.t} · ${s.m.dose}`} maxLines={1} truncate="END" allowFontScaling={false}
                        style={{ fontSize: 10, color: C.muted, marginTop: 2 }} />
                    </FlexWidget>
                    <TextWidget text={done ? '완료' : '체크'} allowFontScaling={false}
                      style={{ fontSize: 10, color: done ? '#755823' : C.white,
                        backgroundColor: done ? '#f5e8bd' : C.primary, borderRadius: 8,
                        paddingHorizontal: 5, paddingVertical: 8, marginLeft: 3 }} />
                  </FlexWidget>
                );
              })}
              {row.length === 1 && <FlexWidget style={{ flex: 1 }} />}
            </FlexWidget>
          ))}
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

// Independent fallback: no database reads or compiler-generated hooks.
export function WidgetError({ message }: { message: string }) {
  'use no memo';
  return (
    <FlexWidget style={{ width: 'match_parent', height: 'match_parent', padding: 16,
      backgroundColor: '#fff1e8', borderRadius: 20 }} clickAction="OPEN_APP">
      <TextWidget text="혜진의 하루약" style={{ fontSize: 16, color: '#4c3c61', fontWeight: 'bold' }} />
      <TextWidget text="위젯을 표시하지 못했어요. 눌러서 앱을 열고 다시 갱신해 주세요."
        maxLines={4} style={{ fontSize: 12, color: '#a83434', marginTop: 8 }} />
      <TextWidget text={message} maxLines={3} style={{ fontSize: 10, color: '#796d87', marginTop: 8 }} />
    </FlexWidget>
  );
}
