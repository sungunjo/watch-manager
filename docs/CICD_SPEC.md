# Watch Manager - CI/CD Specification Sheet

> **Version**: 1.0
> **Last Updated**: 2026-03-04
> **Target Platform**: iOS / Android (Cross-platform)
> **Framework**: React Native (Expo) - SPEC 6.1 기술 스택 기준
> **CI/CD Platform**: GitHub Actions
> **빌드 서비스**: EAS Build (Expo Application Services)
> **Signing**: GitHub Secrets + EAS Credentials 기반 관리

---

## 1. CI/CD 전체 아키텍처

### 1.1 파이프라인 개요도

```
[Feature Branch]          [main Branch]
      │                        │
      ▼                        ▼
 ┌──────────┐          ┌──────────────┐
 │  PR Open  │          │  PR Merged   │
 │  / Sync   │          │  (Push)      │
 └─────┬────┘          └──────┬───────┘
       │                      │
       ▼                      ▼
 ┌──────────────┐      ┌──────────────────────────────────────────────┐
 │  CI Pipeline  │      │              CD Pipeline                     │
 │               │      │                                              │
 │ ① TypeCheck   │      │ ① Version 추출 (app.json / app.config.ts)   │
 │ ② Lint (ESLint)│     │ ② EAS Build (Android APK/AAB)               │
 │ ③ Unit Test   │      │ ③ EAS Build (iOS IPA) - 선택적              │
 │ ④ Build Check │      │ ④ GitHub Release 생성 (태그 + 릴리스 노트)   │
 │               │      │ ⑤ APK/AAB를 Release Asset으로 업로드         │
 └──────────────┘      └──────────────────────────────────────────────┘
```

### 1.2 브랜치 전략

| 브랜치 | 용도 | CI | CD |
|--------|------|----|----|
| `feature/*`, `fix/*`, `claude/*` | 기능 개발 / 버그 수정 | PR 시 CI 실행 | - |
| `main` | 프로덕션 릴리스 브랜치 | - | PR 머지 시 Release 빌드 + GitHub Release 배포 |

### 1.3 기술 스택과 CI/CD 도구 매핑

| SPEC 기술 스택 | CI/CD 대응 도구 |
|---------------|----------------|
| React Native (Expo) | EAS Build (클라우드 네이티브 빌드) |
| TypeScript | `tsc --noEmit` (타입 체크) |
| ESLint | `npx expo lint` (린트) |
| Jest | `npx jest` (단위 테스트) |
| SQLite / WatermelonDB | 로컬 DB - 빌드 시 네이티브 모듈 포함 |
| Firebase Cloud Messaging | 빌드 시 `google-services.json` 주입 |

---

## 2. CI Pipeline (Pull Request 검증)

### 2.1 트리거 조건

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'app/**'
      - '*.ts'
      - '*.tsx'
      - '*.json'
      - 'package.json'
      - 'tsconfig.json'
      - '.github/workflows/**'
```

### 2.2 CI 단계 상세

| 단계 | 명령어 | 목적 | 실패 시 |
|------|--------|------|---------|
| **① TypeScript 타입 체크** | `npx tsc --noEmit` | 타입 안정성 검증 | PR 머지 차단 |
| **② ESLint** | `npx expo lint` | 코드 스타일 및 품질 검증 | PR 머지 차단 |
| **③ Unit Test** | `npx jest --ci --coverage` | 비즈니스 로직 테스트 (일차 계산, 오버홀 알림 등) | PR 머지 차단 |
| **④ Expo Build Check** | `npx expo export --platform web` | 번들링 가능 여부 빠른 검증 | PR 머지 차단 |

### 2.3 CI Job 구성

```
ci.yml
├── Environment: ubuntu-latest
├── Node.js: 20 (LTS)
├── Package Manager: npm (lockfile 기반)
├── Cache: node_modules + Expo cache
│
├── Step 1: Checkout
├── Step 2: Setup Node.js 20
├── Step 3: Cache node_modules
├── Step 4: Install Dependencies (npm ci)
├── Step 5: TypeScript Type Check (tsc --noEmit)
├── Step 6: ESLint (npx expo lint)
├── Step 7: Unit Tests (jest --ci --coverage)
├── Step 8: Expo Export Check (expo export --platform web)
├── Step 9: Upload Coverage Report (artifact, always)
└── Step 10: Upload Test Report (artifact, on failure)
```

### 2.4 Artifact 관리

| Artifact | 조건 | 보관기간 |
|----------|------|---------|
| Coverage Report (`coverage/`) | 항상 | 7일 |
| Test Report (Jest 결과) | 실패 시 | 7일 |

---

## 3. CD Pipeline (Release 빌드 & 배포)

### 3.1 트리거 조건

```yaml
on:
  push:
    branches: [main]
```

> main 브랜치에 PR이 머지되면 (= push 이벤트 발생) 자동으로 CD 파이프라인이 실행된다.

### 3.2 CD 단계 상세

| 단계 | 작업 | 설명 |
|------|------|------|
| **① Version 추출** | `app.json` 또는 `app.config.ts`에서 `version`, `android.versionCode` 추출 | Release 태그 이름에 사용 |
| **② EAS Build (Android)** | `eas build --platform android --profile production --non-interactive` | Release APK/AAB 생성 (EAS 클라우드) |
| **③ Build Artifact 다운로드** | EAS Build 완료 후 빌드 산출물(APK/AAB) 다운로드 | `eas build:list` + URL로 다운로드 |
| **④ GitHub Release 생성** | `v{version}` 태그로 Release 생성 | 자동 릴리스 노트 포함 |
| **⑤ Asset 업로드** | 다운로드한 APK/AAB를 Release에 첨부 | 사용자 다운로드 가능 |

### 3.3 CD Job 구성

```
cd.yml
├── Environment: ubuntu-latest
├── Node.js: 20 (LTS)
├── Cache: node_modules
│
├── Step 1: Checkout
├── Step 2: Setup Node.js 20
├── Step 3: Cache node_modules
├── Step 4: Install Dependencies (npm ci)
├── Step 5: Setup EAS CLI
├── Step 6: Extract version from app.json
├── Step 7: EAS Build Android (production profile)
├── Step 8: Download build artifact from EAS
├── Step 9: Create GitHub Release with tag
└── Step 10: Upload APK/AAB as Release Assets
```

### 3.4 EAS Build vs 로컬 빌드 비교

| 항목 | EAS Build (채택) | 로컬 빌드 (대안) |
|------|-----------------|-----------------|
| Android SDK 설정 | 불필요 (EAS 클라우드에서 처리) | Runner에 Android SDK 설치 필요 |
| iOS 빌드 | EAS에서 macOS 빌드 지원 | `macos-latest` Runner 필요 (비용 높음) |
| 서명 관리 | EAS Credentials 관리 | GitHub Secrets에서 직접 관리 |
| 빌드 속도 | 큐잉 대기 있을 수 있음 | Runner 가용 시 즉시 빌드 |
| 비용 | EAS Free 30빌드/월 | GitHub Actions 무료 2000분/월 |

> **결정 근거**: Expo 프로젝트의 네이티브 빌드는 EAS Build가 표준이며, Android SDK/Gradle/JDK 환경 구성 없이 빌드 가능. iOS 빌드도 동일 파이프라인에서 처리 가능.

### 3.5 중복 Release 방지

- Release 생성 전 동일 태그(`v{version}`) 존재 여부를 확인
- 동일 태그가 이미 존재하면 version + versionCode 조합으로 태그 생성 (`v1.0.0-build.5`)
- 이를 통해 같은 버전으로 여러 번 머지되어도 안전하게 처리

---

## 4. Signing (서명) 전략

### 4.1 Android 서명

EAS Build의 Credentials 관리 기능을 활용하여 서명을 처리한다.

**방식 A: EAS Managed Credentials (권장)**
- EAS가 Keystore를 자동 생성 및 관리
- `eas credentials` 명령으로 Keystore 확인/다운로드 가능
- CI에서 별도 Keystore 파일 관리 불필요

**방식 B: Custom Keystore (수동 관리)**
- 직접 생성한 Keystore를 EAS에 업로드하여 사용
- Google Play 배포 시 기존 Keystore 유지가 필요한 경우 선택

### 4.2 필요한 GitHub Secrets

| Secret 이름 | 설명 | 용도 |
|-------------|------|------|
| `EXPO_TOKEN` | Expo 계정 Access Token | EAS CLI 인증 (`eas build` 실행) |

> **참고**: EAS Managed Credentials 방식을 사용하면 Keystore 관련 Secret은 불필요. Keystore는 EAS 서버에서 안전하게 관리된다.

### 4.3 EAS 인증 프로세스

```bash
# CI 환경에서 EAS CLI 인증 (EXPO_TOKEN 환경변수 자동 인식)
export EXPO_TOKEN=${{ secrets.EXPO_TOKEN }}

# EAS Build 실행 (인증 자동 처리)
npx eas-cli build --platform android --profile production --non-interactive
```

---

## 5. EAS Build 프로필 설정

### 5.1 eas.json 구성

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 5.2 빌드 프로필 역할

| 프로필 | 용도 | 산출물 | 사용 시점 |
|--------|------|--------|----------|
| `development` | 로컬 개발용 | Debug APK (Dev Client) | 개발자 로컬 테스트 |
| `preview` | QA/내부 테스트용 | Release APK (내부 배포) | 향후 확장 시 |
| `production` | 프로덕션 릴리스 | Signed Release APK | CD 파이프라인에서 사용 |

---

## 6. 캐싱 전략

### 6.1 Node.js 의존성 캐시

| 캐시 대상 | 경로 | 키 |
|----------|------|-----|
| node_modules | `node_modules/` | `node-${{ hashFiles('package-lock.json') }}` |
| npm cache | `~/.npm` | 위와 동일 |

### 6.2 캐시 효과

- `npm ci` 시간 단축 (첫 빌드 대비 약 50-60% 절감)
- EAS Build는 클라우드에서 자체 캐시 관리 (별도 설정 불필요)

---

## 7. 버전 관리 규칙

### 7.1 버전 체계

```
version = "MAJOR.MINOR.PATCH"           (예: "1.0.0", "1.2.3")
android.versionCode = 자동 증가 정수     (예: 1, 2, 3, ...)
ios.buildNumber = versionCode와 동일     (예: "1", "2", "3")
```

| 구분 | 의미 | 변경 시점 |
|------|------|----------|
| MAJOR | 대규모 변경, 하위 비호환 | 앱 전면 리디자인, 아키텍처 변경 |
| MINOR | 기능 추가 | Phase 단위 릴리스 (Phase 1, 2, 3) |
| PATCH | 버그 수정 | 핫픽스, 마이너 수정 |

### 7.2 버전 소스

- **Single Source of Truth**: `app.json`의 `expo.version` 및 `expo.android.versionCode`
- CD 파이프라인이 이 값을 읽어 GitHub Release 태그를 생성
- 버전 업데이트는 PR에서 개발자가 직접 수행 (수동)

### 7.3 app.json 버전 필드 예시

```json
{
  "expo": {
    "name": "Watch Manager",
    "slug": "watch-manager",
    "version": "1.0.0",
    "android": {
      "package": "com.watchmanager.app",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.watchmanager.app",
      "buildNumber": "1"
    }
  }
}
```

---

## 8. GitHub Release 스펙

### 8.1 Release 구성

| 항목 | 내용 |
|------|------|
| **Tag** | `v{version}` (예: `v1.0.0`) |
| **Title** | `Watch Manager v{version}` |
| **Body** | 자동 생성 릴리스 노트 (이전 Release 이후 머지된 PR 목록) |
| **Assets** | `watch-manager-v{version}.apk` |
| **Pre-release** | `false` |

### 8.2 릴리스 노트 자동 생성

GitHub의 `automatically_generated_release_notes` 기능을 활용하여:
- 이전 릴리스 태그 이후 머지된 PR 목록을 자동으로 릴리스 노트에 포함
- PR 제목이 릴리스 노트의 변경사항 항목이 됨

---

## 9. 환경 요구사항

### 9.1 CI 빌드 환경

| 항목 | 버전/값 |
|------|--------|
| Runner | `ubuntu-latest` |
| Node.js | 20 LTS |
| Package Manager | npm (package-lock.json 기반) |
| EAS CLI | 최신 안정 버전 |

### 9.2 CD 빌드 환경

| 항목 | 버전/값 |
|------|--------|
| Runner | `ubuntu-latest` (EAS Build 트리거 용도) |
| EAS Build 서버 | Expo 관리형 (Android SDK, JDK 17 등 자동 구성) |
| Node.js | 20 LTS |

### 9.3 필요 권한

| 권한 | 용도 |
|------|------|
| `contents: write` | GitHub Release 생성 및 Asset 업로드 |
| `pull-requests: read` | PR 정보 조회 (릴리스 노트 생성) |

---

## 10. 워크플로우 파일 구조

```
.github/
└── workflows/
    ├── ci.yml          # PR 검증 (TypeCheck + Lint + Test + Build Check)
    └── cd.yml          # EAS Build + GitHub Release 배포
```

### 10.1 워크플로우 요약

| 파일 | 트리거 | 목적 | 예상 소요시간 |
|------|--------|------|-------------|
| `ci.yml` | PR to `main` | 코드 품질 검증 | 2~4분 |
| `cd.yml` | Push to `main` (PR 머지) | Release 빌드 + 배포 | 10~15분 (EAS Build 포함) |

---

## 11. 보안 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | `EXPO_TOKEN`이 GitHub Secrets에 등록되어 있는가 | 필수 |
| 2 | `google-services.json`이 `.gitignore`에 포함되어 있는가 | 필수 (Firebase 사용 시) |
| 3 | `GITHUB_TOKEN` 권한이 최소 필요 권한으로 제한되어 있는가 | 필수 |
| 4 | 빌드 시 민감 정보가 로그에 노출되지 않는가 | 필수 |
| 5 | EAS Credentials에서 Keystore가 안전하게 관리되고 있는가 | 필수 |
| 6 | `.env` 파일이 `.gitignore`에 포함되어 있는가 | 필수 |
| 7 | Third-party Actions의 버전이 특정 SHA 또는 major 태그로 고정되어 있는가 | 권장 |

---

## 12. 향후 확장 계획

### Phase 2 (프로젝트 성숙 시)

| 항목 | 설명 |
|------|------|
| **iOS 빌드 추가** | CD에 `eas build --platform ios` 추가, TestFlight 배포 |
| **E2E Test** | Detox 또는 Maestro 기반 E2E 테스트 CI 추가 |
| **Google Play 배포** | EAS Submit (`eas submit --platform android`) 으로 Internal Track 자동 업로드 |
| **App Store 배포** | EAS Submit (`eas submit --platform ios`) 으로 TestFlight 자동 업로드 |
| **Firebase App Distribution** | QA용 내부 배포 채널 추가 |
| **Code Coverage Gate** | Jest coverage threshold 설정 + PR 코멘트로 커버리지 리포트 |
| **OTA Update** | `eas update`를 활용한 JS 번들 OTA 업데이트 (앱스토어 재배포 없이 핫픽스) |
| **Dependency Check** | Dependabot 또는 Renovate Bot 활용 의존성 자동 업데이트 |
| **Preview Build** | PR마다 `preview` 프로필로 APK 빌드하여 PR 코멘트에 다운로드 링크 첨부 |

### Phase 2 확장 시 파이프라인

```
.github/
└── workflows/
    ├── ci.yml              # PR 검증 (현재)
    ├── cd.yml              # Release 빌드 + GitHub Release (현재)
    ├── preview.yml         # PR별 Preview APK 빌드 (Phase 2)
    ├── e2e.yml             # E2E 테스트 (Phase 2)
    └── submit.yml          # Google Play / App Store 제출 (Phase 2)
```

---

## 13. 파이프라인 흐름 요약

```
개발자가 Feature Branch에서 작업
        │
        ▼
PR 생성 (target: main)
        │
        ▼
┌─── CI Pipeline 자동 실행 ──────┐
│  ✓ TypeScript Type Check       │
│  ✓ ESLint                      │
│  ✓ Jest Unit Tests + Coverage  │
│  ✓ Expo Export Check           │
└──────────────┬─────────────────┘
               │
          통과 시
               │
        ▼
코드 리뷰 + Approve
        │
        ▼
PR Merge to main
        │
        ▼
┌─── CD Pipeline 자동 실행 ──────┐
│  ✓ app.json에서 버전 추출       │
│  ✓ EAS Build (Android APK)     │
│  ✓ 빌드 산출물 다운로드          │
│  ✓ GitHub Release 생성 (태그)   │
│  ✓ APK를 Release Asset으로 첨부 │
└──────────────┬─────────────────┘
               │
               ▼
      GitHub Release 완성
        - 서명된 APK 다운로드 가능
        - 자동 릴리스 노트 포함
        - v{version} 태그 생성
```
