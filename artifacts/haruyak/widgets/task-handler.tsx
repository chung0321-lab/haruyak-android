import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MedicationWidget } from './MedicationWidget';
import { emptyDatabase, readDatabase, setDoseFromWidget, today } from '../lib/store';
import { refreshWidgets } from '../lib/widget-refresh';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  try {
    if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'SET_DOSE') {
      const { key, day, completed } = props.clickActionData ?? {};
      // A yesterday widget must refresh, never record a dose against yesterday
      // just because the OS delayed its midnight update.
      if (typeof key === 'string' && day === today() && typeof completed === 'boolean') {
        await setDoseFromWidget(key, completed);
      }
    }
    props.renderWidget(<MedicationWidget db={await readDatabase()} info={props.widgetInfo} />);
    await refreshWidgets();
  } catch (e) {
    const db = await readDatabase().catch(() => emptyDatabase());
    props.renderWidget(<MedicationWidget db={db} info={props.widgetInfo}
      error={`처리하지 못했어요. 새로고침하거나 앱을 열어 주세요.\n${e instanceof Error ? e.message : '저장 오류'}`} />);
  }
}
