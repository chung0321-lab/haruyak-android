#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v java >/dev/null || { echo "JDK 17 이상을 먼저 설치하세요."; exit 1; }
test -n "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" || {
  echo "Android Studio SDK를 설치하고 ANDROID_HOME을 지정하세요."; exit 1;
}
# Regenerate native providers from committed Expo plugins on every build.
pnpm exec expo prebuild --platform android --no-install
(
  cd android
  # Release embeds JS/assets: Metro and any server are NOT needed after install.
  # Expo's generated release uses the development keystore by default. Suitable
  # for personal sideload validation, not a Play Store production signing key.
  ./gradlew :app:assembleRelease --no-daemon
)
mkdir -p ../../generated-artifacts/android
cp android/app/build/outputs/apk/release/app-release.apk ../../generated-artifacts/android/haruyak.apk
echo "APK: generated-artifacts/android/haruyak.apk (개인 설치용 서명)"
