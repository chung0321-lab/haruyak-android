import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Custom native widget module is not present in Expo Go. Never evaluate it in
// web or Expo Go; the same app can still preview the real local app screens.
if (Platform.OS === 'android' && Constants.executionEnvironment !== 'storeClient') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widgets/task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
require('expo-router/entry');
