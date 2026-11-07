# 혜진의 하루약

기기에 복약 일정을 저장하고 실제 갤럭시 홈 화면 위젯에서 복용 체크·취소를 할 수 있는 Android 중심 Expo 앱.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- 하루약 앱에는 서버나 데이터베이스 환경 변수가 필요하지 않습니다. 남아 있는 API/DB 패키지는 초기 템플릿이며 하루약이 사용하지 않습니다.
- 모바일 실행: 관리되는 `artifacts/haruyak: expo` 워크플로
- Android APK: `bash artifacts/haruyak/scripts/build-android.sh` (PC의 JDK/Android SDK 필요)
- 설치·빌드·실기기 확인: `artifacts/haruyak/ANDROID-GUIDE.md`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/haruyak/app/` — 오늘, 약 관리, 기록, 위젯·백업, 약 편집
- `artifacts/haruyak/lib/` — 원본 JSON 모델·검증과 로컬 저장·백업
- `artifacts/haruyak/widgets/` — 실제 Android 위젯과 headless 클릭 처리
- `artifacts/haruyak/plugins/` — Android 날짜 갱신 수신기·예약
- `.github/workflows/android-apk.yml` — 수동 실행 APK 빌드

## Architecture decisions

- 실제 Android 위젯이 핵심이다. Expo Go·웹의 앱 화면 미리보기는 네이티브 위젯 검증을 대체하지 않는다.
- 앱과 headless 위젯이 동시에 기록을 수정할 수 있어 네이티브 SQLite의 write transaction으로 조정한다.
- 원본 HTML JSON의 ID·일정 문자열·기록 키·목록 순서를 보존한다. 복원은 확인 후 전체 교체한다.
- 복약 알람은 없다. 자정 내부 갱신은 비정확 예약이며 One UI 절전에서 지연될 수 있다.

## Product

파스텔 복약 일정 관리, 날짜별 복용 체크와 취소, 목록 순서 편집, 기록 조회, JSON 가져오기·내보내기. 작은 홈 위젯은 완료 횟수와 다음 일정, 큰 홈 위젯은 오늘 목록과 체크·취소를 제공한다.

## User preferences

원본 HTML의 파스텔 디자인과 알약 아이콘을 유지한다. 로그인·서버·복약 알람은 추가하지 않는다.

## Gotchas

- 네이티브 변경은 새 APK가 필요하다. Expo Go에는 custom widget 모듈이 없다.
- 생성된 `android/`는 직접 수정하지 말고 Expo plugin을 수정한다.
- 기본 APK 스크립트는 개인 설치 검증용 개발 서명을 사용한다. 장기 사용은 본인 서명 키를 유지하고, 앱 삭제 전 JSON 백업한다.
- 이 개발 환경에서는 Android JS 번들·prebuild·타입·의존성 검사를 수행했지만 APK 컴파일·실기기 실행은 미확인이다.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
