---
name: Android 위젯 생성 순서
description: Expo prebuild 플러그인 순서 때문에 provider 변경이 사라질 수 있는 비직관적 제약
---

위젯 라이브러리의 provider 생성이 custom dangerous mod보다 나중에 실행되어 같은 Java 파일을 덮어쓸 수 있다. prebuild 성공 자체는 추가한 lifecycle 로직이 남아 있다는 증거가 아니다.

**Why:** 생성된 provider에서 날짜 갱신 예약을 호출하는 로직이 사라지는 것을 확인했다. 라이브러리 생성 이후 실행되는 Android base mod 단계에서 확장해야 했다.

**How to apply:** 네이티브 위젯의 생성 동작을 변경할 때 최종 생성된 소스와 manifest에서 필요한 lifecycle 호출·수신기를 확인한다. 생성된 android 폴더 수동 수정 대신 재생성 가능한 플러그인에 반영한다.
