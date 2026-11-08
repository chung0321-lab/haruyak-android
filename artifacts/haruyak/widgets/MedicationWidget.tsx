'use no memo';

import React from 'react';
import { FlexWidget, ImageWidget, ListWidget, TextWidget, type WidgetInfo } from 'react-native-android-widget';
import { type Database, nextDose, slots, today } from '../lib/model';
import { largeWidgetLayout, widgetColumnWidth, widgetRows } from './layout';

const C = { ink: '#51405e', muted: '#88768f', primary: '#8262ad', peach: '#fff0e7',
  lilac: '#f0eaff', card: '#fffdfa', done: '#e7f2e9' } as const;

export function MedicationWidget({ db, info, error }: { db: Database; info: WidgetInfo; error?: string }) {
  'use no memo';
  const day = today(), list = slots(db, day), completed = list.filter(s => db.checks[s.key]).length;
  const small = info.widgetName === 'HaruSmall', next = nextDose(db);
  const columns = 2;
  const columnWidth = widgetColumnWidth(info.width);
  const { contentHeight, rowHeight, rowGap } = largeWidgetLayout(info.height);
  const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
  const allDone = list.length > 0 && completed === list.length;
  const barWidth = Math.max(40, (Number.isFinite(info.width) && info.width > 0 ? info.width : 250) - 24);
  const progressWidth = Math.round(barWidth * (list.length ? completed / list.length : 0));
  return (
    <FlexWidget clickAction="OPEN_APP" accessibilityLabel="혜진의 하루약 앱 열기"
      style={{ width: 'match_parent', height: 'match_parent', padding: 12, borderRadius: 24,
        backgroundColor: C.peach, backgroundGradient: { from: C.peach, to: C.lilac, orientation: 'TL_BR' } }}>
      <FlexWidget clickAction="OPEN_APP" accessibilityLabel="날짜와 제목. 눌러서 앱 열기"
        style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', height: small ? 24 : 28 }}>
        <ImageWidget image={require('../assets/images/icon.png')} imageWidth={small ? 20 : 26} imageHeight={small ? 20 : 26} />
        <FlexWidget style={{ flex: 1, marginLeft: 7 }}>
          <TextWidget text="혜진의 하루약" maxLines={1} truncate="END" allowFontScaling={false}
            style={{ fontSize: small ? 11 : 14, height: 22, lineHeight: 20, fontWeight: 'bold', color: C.ink }} />
        </FlexWidget>
        {!small && <TextWidget text="열기 ›" clickAction="OPEN_APP" accessibilityLabel="하루약 앱 열기"
          style={{ fontSize: 10, color: C.primary, padding: 6, backgroundColor: '#ffffff', borderRadius: 10 }} />}
      </FlexWidget>
      {/* Give Android's Korean font ascent/descent a dedicated line, outside
          the fixed-height title row. No title/date compression on One UI. */}
      <TextWidget text={dateLabel} maxLines={1} allowFontScaling={false} clickAction="OPEN_APP"
        accessibilityLabel={`오늘 날짜 ${dateLabel}. 앱 열기`}
        style={{ fontSize: 10, lineHeight: 16, height: 20, paddingBottom: 2, marginTop: 2, color: C.muted }} />
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        width: 'match_parent', height: small ? 32 : 28, marginTop: 4 }}>
        <TextWidget text={small ? `${completed} / ${list.length}` : `오늘 ${completed} / ${list.length}회 완료`}
          allowFontScaling={false} style={{ fontSize: small ? 22 : 13, color: C.primary, fontWeight: 'bold' }} />
        <TextWidget text={allDone ? '모두 완료!' : '차근차근'} allowFontScaling={false}
          style={{ fontSize: 9, color: C.muted }} />
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', height: 4, backgroundColor: '#e5d9ed', borderRadius: 3, marginBottom: 8 }}>
        {progressWidth > 0 && <FlexWidget style={{ width: progressWidth, height: 4, backgroundColor: C.primary, borderRadius: 3 }} />}
      </FlexWidget>
      {error ? (
        <TextWidget text={error} maxLines={3} clickAction="OPEN_APP" style={{ fontSize: 11, color: '#a83434' }} />
      ) : small ? (
        <FlexWidget clickAction="OPEN_APP" style={{ flex: 1, width: 'match_parent', justifyContent: 'center' }}>
          <TextWidget text={next ? next.m.name : allDone ? '오늘도 잘 챙겼어요' : '오늘 복용 일정 없음'} maxLines={1} truncate="END"
            allowFontScaling={false} style={{ fontSize: 12, color: C.ink, fontWeight: 'bold' }} />
          <TextWidget text={next ? next.t : '눌러서 앱 열기'} maxLines={2} allowFontScaling={false}
            style={{ fontSize: 10, color: C.muted, marginTop: 3 }} />
        </FlexWidget>
      ) : list.length ? (
        <ListWidget style={{ width: 'match_parent', height: contentHeight }}>
          {widgetRows(list, columns).map((row, rowIndex) => (
            <FlexWidget key={row[0].key} style={{ width: 'match_parent', height: rowHeight,
              flexDirection: 'row', marginBottom: rowGap, flexGap: 6 }}>
              {row.map((s, column) => {
                const done = !!db.checks[s.key];
                return (
                  <FlexWidget key={s.key} clickAction="OPEN_APP" accessibilityLabel={`${s.m.name} 상세 정보. 앱 열기`}
                    style={{ width: columnWidth, height: rowHeight, flexDirection: 'row', alignItems: 'center',
                      paddingLeft: 8, paddingRight: 3, borderRadius: 13, borderWidth: 1,
                      borderColor: done ? '#cfdfd0' : '#ffffff',
                      backgroundColor: done ? C.done : column ? '#f9f5ff' : C.card }}>
                    <FlexWidget style={{ flex: 1 }}>
                      <TextWidget text={s.m.name} maxLines={1} truncate="END" allowFontScaling={false}
                        style={{ fontSize: 12, color: C.ink, fontWeight: 'bold' }} />
                      <TextWidget text={s.t} maxLines={1} truncate="END" allowFontScaling={false}
                        style={{ fontSize: 9, color: C.muted, marginTop: 3 }} />
                    </FlexWidget>
                    <FlexWidget clickAction="SET_DOSE" clickActionData={{ key: s.key, day, completed: !done }}
                      accessibilityLabel={`${rowIndex * columns + column + 1}. ${s.m.name} ${s.t}. ${done ? '복용 완료, 누르면 취소' : '누르면 복용 완료'}`}
                      style={{ width: 44, height: rowHeight, justifyContent: 'center', alignItems: 'center' }}>
                      <TextWidget text={done ? '✓' : '○'} allowFontScaling={false}
                        style={{ fontSize: 20, fontWeight: 'bold', color: done ? '#568365' : C.primary }} />
                    </FlexWidget>
                  </FlexWidget>
                );
              })}
              {row.length === 1 && <FlexWidget style={{ width: columnWidth, height: rowHeight }} />}
            </FlexWidget>
          ))}
        </ListWidget>
      ) : (
        <FlexWidget clickAction="OPEN_APP" style={{ height: contentHeight, width: 'match_parent',
          justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffaf7', borderRadius: 14 }}>
          <TextWidget text="오늘은 어떤 약을 챙길까요?" style={{ fontSize: 12, color: C.ink, fontWeight: 'bold' }} />
          <TextWidget text="눌러서 복용 일정 등록하기" style={{ fontSize: 10, color: C.muted, marginTop: 5 }} />
        </FlexWidget>
      )}
      {!small && <FlexWidget clickAction="REFRESH" accessibilityLabel="최신 복약 기록 새로고침"
        style={{ flexDirection: 'row', width: 'match_parent', justifyContent: 'flex-end',
        alignItems: 'center', height: 28, marginTop: 4 }}>
        <TextWidget text="새로고침" allowFontScaling={false}
          style={{ fontSize: 10, lineHeight: 14, height: 26, paddingHorizontal: 8, paddingVertical: 3,
            color: C.primary, backgroundColor: '#ffffff', borderRadius: 10 }} />
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
      <TextWidget text="위젯을 표시하지 못했어요. 눌러서 앱을 열어 주세요."
        maxLines={4} style={{ fontSize: 12, color: '#a83434', marginTop: 8 }} />
      <TextWidget text={message} maxLines={3} style={{ fontSize: 10, color: '#796d87', marginTop: 8 }} />
    </FlexWidget>
  );
}
