import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MedicationWidget, WidgetError } from './MedicationWidget';
import { readDatabase, setDoseFromWidget, today } from '../lib/store';
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
    console.error('[HaruWidget] render failed', e);
    props.renderWidget(<WidgetError message={e instanceof Error ? e.message : '저장 오류'} />);
  }
}
