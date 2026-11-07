const { withAndroidManifest, withDangerousMod, withMainApplication, withAppBuildGradle } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// No notifications or medication alarms. This is an inexact internal widget
// refresh, allowed to be delayed by Android/One UI power management.
module.exports = function withDayRefresh(config) {
  const pkg = config.android.package;
  config = withMainApplication(config, mod => {
    const marker = `${pkg}.widget.DayRefreshReceiver.schedule(this)`;
    if (!mod.modResults.contents.includes(marker)) {
      const java = mod.modResults.language === 'java';
      mod.modResults.contents = mod.modResults.contents.replace(
        /super\.onCreate\(\);?/,
        match => `${match}\n    ${marker}${java ? ';' : ''}`,
      );
    }
    return mod;
  });
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application[0];
    app.$['android:allowBackup'] = 'false';
    app.receiver = app.receiver || [];
    if (!app.receiver.some(r => r.$['android:name'] === '.widget.DayRefreshReceiver')) {
      app.receiver.push({
        $: { 'android:name': '.widget.DayRefreshReceiver', 'android:exported': 'false' },
        'intent-filter': [{
          action: ['BOOT_COMPLETED', 'DATE_CHANGED', 'TIME_SET', 'TIMEZONE_CHANGED', 'MY_PACKAGE_REPLACED']
            .map(a => ({ $: { 'android:name': `android.intent.action.${a}` } })),
        }],
      });
    }
    return mod;
  });
  config = withDangerousMod(config, ['android', async mod => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java', pkg.replace(/\./g, '/'), 'widget');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'DayRefreshReceiver.java'), `package ${pkg}.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;

public class DayRefreshReceiver extends BroadcastReceiver {
  public static void schedule(Context context) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    int count = manager.getAppWidgetIds(new ComponentName(context, HaruSmall.class)).length
      + manager.getAppWidgetIds(new ComponentName(context, HaruLarge.class)).length;
    Intent intent = new Intent(context, DayRefreshReceiver.class).setAction("${pkg}.REFRESH_DAY");
    PendingIntent pending = PendingIntent.getBroadcast(context, 7201, intent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    if (count == 0) { alarms.cancel(pending); return; }
    Calendar midnight = Calendar.getInstance();
    midnight.add(Calendar.DAY_OF_YEAR, 1);
    midnight.set(Calendar.HOUR_OF_DAY, 0);
    midnight.set(Calendar.MINUTE, 0);
    midnight.set(Calendar.SECOND, 2);
    midnight.set(Calendar.MILLISECOND, 0);
    alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, midnight.getTimeInMillis(), pending);
  }
  @Override public void onReceive(Context context, Intent incoming) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    for (Class<?> provider : new Class<?>[] {HaruSmall.class, HaruLarge.class}) {
      ComponentName component = new ComponentName(context, provider);
      int[] ids = manager.getAppWidgetIds(component);
      if (ids.length > 0) {
        Intent update = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
          .setComponent(component).putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(update);
      }
    }
    schedule(context);
  }
}
`);
    return mod;
  }]);
  // Dangerous mods run before Android base mods, so the library can overwrite
  // its providers after our dangerous mod. Extend them at the app Gradle stage,
  // after provider generation, while leaving Gradle's actual contents unchanged.
  config = withAppBuildGradle(config, mod => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java', pkg.replace(/\./g, '/'), 'widget');
    fs.mkdirSync(dir, { recursive: true });
    for (const name of ['HaruSmall', 'HaruLarge']) {
      fs.writeFileSync(path.join(dir, `${name}.java`), `package ${pkg}.widget;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import com.reactnativeandroidwidget.RNWidgetProvider;
public class ${name} extends RNWidgetProvider {
  @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
    super.onUpdate(context, manager, ids);
    DayRefreshReceiver.schedule(context);
  }
  @Override public void onDisabled(Context context) {
    super.onDisabled(context);
    DayRefreshReceiver.schedule(context);
  }
}
`);
    }
    return mod;
  });
  return config;
};
