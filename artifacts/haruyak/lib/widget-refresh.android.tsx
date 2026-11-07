import React from 'react';
import Constants from 'expo-constants';
import { readDatabase } from './store';

export const hasNativeWidgets = () => Constants.executionEnvironment !== 'storeClient';
let queue: Promise<void> = Promise.resolve();
export function refreshWidgets(): Promise<void> {
  if (!hasNativeWidgets()) return Promise.resolve();
  const result = queue.then(async () => {
    const { getWidgetInfo, requestWidgetUpdateById } = await import('react-native-android-widget');
    const { MedicationWidget } = await import('../widgets/MedicationWidget');
    const db = await readDatabase();
    for (const widgetName of ['HaruSmall', 'HaruLarge']) {
      const infos = await getWidgetInfo(widgetName);
      // The library's bulk helper uses forEach(async), so use the awaited
      // per-instance helper instead to propagate errors and sequence refreshes.
      for (const info of infos) {
        await requestWidgetUpdateById({
          widgetName, widgetId: info.widgetId,
          renderWidget: current => <MedicationWidget db={db} info={current} />,
        });
      }
    }
  });
  queue = result.catch(() => undefined);
  return result;
}
