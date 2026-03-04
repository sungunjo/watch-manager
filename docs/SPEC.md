# Watch Manager - App Specification Sheet

> **Version**: 1.0 (MVP)
> **Last Updated**: 2026-03-04
> **Target Platform**: iOS / Android (Cross-platform, React Native or Flutter)

---

## 1. 앱 개요

### 1.1 목적
Watch Manager는 시계 컬렉터(시계 매니아)를 위한 개인 시계 관리 앱이다.
보유한 시계들의 정보를 체계적으로 관리하고, 정밀도 측정 및 오버홀 일정 관리를 통해 시계의 유지보수를 돕고, 일상적인 착용 기록을 남길 수 있다.

### 1.2 타겟 사용자
- 3개 이상의 기계식/쿼츠 시계를 보유한 시계 수집가
- 시계의 상태와 정밀도에 관심이 높은 사용자
- 자신의 컬렉션을 체계적으로 관리하고 싶은 사용자

### 1.3 핵심 가치
- **한눈에 파악**: 보유 시계 전체를 한 화면에서 파악
- **유지관리 자동화**: 측정 이력 기반 상태 추적과 오버홀 알림
- **일상 기록**: 매일의 착용 기록과 사진으로 시계 생활 아카이빙

---

## 2. 기능 정의

### 2.1 시계 컬렉션 관리 (Collection)

#### 2.1.1 시계 등록/편집
사용자가 보유한 시계를 등록하고 상세 스펙을 관리한다.

**시계 기본 정보:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| brand | string | Y | 브랜드명 (ex. Rolex, Omega, Seiko) |
| model_name | string | Y | 모델명 (ex. Submariner, Speedmaster) |
| reference_number | string | N | 레퍼런스 넘버 |
| serial_number | string | N | 시리얼 넘버 |
| caliber | string | N | 캘리버/무브먼트 명칭 |
| movement_type | enum | Y | MECHANICAL_HAND_WIND / MECHANICAL_AUTO / QUARTZ / SPRING_DRIVE / SMART |
| case_diameter_mm | float | N | 케이스 직경 (mm) |
| case_thickness_mm | float | N | 케이스 두께 (mm) |
| lug_to_lug_mm | float | N | 러그 투 러그 (mm) |
| lug_width_mm | float | N | 러그 폭 (mm) |
| case_material | string | N | 케이스 소재 (ex. Stainless Steel, Titanium, Gold) |
| crystal_type | enum | N | SAPPHIRE / MINERAL / ACRYLIC / HARDLEX |
| water_resistance_m | int | N | 방수 성능 (m) |
| dial_color | string | N | 다이얼 색상 |
| complication | string[] | N | 컴플리케이션 목록 (ex. Date, Chronograph, GMT, Moon Phase) |
| power_reserve_hours | int | N | 파워리저브 (시간) |
| frequency_bph | int | N | 진동수 (bph, ex. 28800) |
| photo | image[] | N | 시계 사진 (다중 등록 가능) |
| nickname | string | N | 사용자 지정 별명 |
| notes | string | N | 메모 |

**구매 정보:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| purchase_date | date | N | 구매일 |
| purchase_price | decimal | N | 구매가 |
| purchase_currency | enum | N | 통화 (KRW, USD, EUR, JPY, CHF, etc.) |
| purchase_channel | string | N | 구매처 (ex. AD, 병행, 중고) |
| purchase_condition | enum | N | NEW / USED / VINTAGE |
| warranty_expiry_date | date | N | 보증 만료일 |
| receipt_photo | image | N | 영수증/보증서 사진 |

**상태 관리:**
| 필드 | 타입 | 설명 |
|------|------|------|
| status | enum | WEARING(착용중) / STORED(보관중) / IN_SERVICE(수리중) / SOLD(매각) |
| is_active | boolean | 현재 컬렉션에 포함 여부 |

#### 2.1.2 시계 목록 화면
- 그리드 뷰 (사진 중심) / 리스트 뷰 전환 가능
- 정렬: 등록일, 브랜드, 모델명, 구매일, 최근 착용일
- 필터: 브랜드, 무브먼트 타입, 상태
- 검색: 브랜드, 모델명, 레퍼런스 넘버 텍스트 검색

#### 2.1.3 시계 상세 화면
시계의 모든 정보를 탭으로 구분하여 표시:
- **스펙 탭**: 기본 정보 + 구매 정보
- **정밀도 탭**: Timegrapher 측정 이력 (2.2와 연계)
- **유지보수 탭**: 서비스/오버홀 이력 (2.3과 연계)
- **착용 기록 탭**: 해당 시계의 착용 이력 (2.4와 연계)

---

### 2.2 Timegrapher (정밀도 측정)

#### 2.2.1 개요
기계식 시계의 정밀도를 측정하는 기능. 전문 타임그래퍼 장비 없이도 시계의 일차(daily rate)를 간편하게 측정할 수 있다.

#### 2.2.2 측정 방식

**방식 A: 수동 오차 측정 (Simple Mode)**
1. 사용자가 기준 시간(NTP 또는 단말기 시각)과 시계 시각을 비교
2. 일정 시간 경과 후 다시 비교
3. 경과 시간 대비 오차를 계산하여 일차(sec/day)로 환산

**측정 플로우:**
```
[측정 시작] → 기준 시각 표시 + 시계 시각을 사용자가 탭으로 입력
    → 일정 시간 경과 (최소 1시간 권장, 24시간 이상 권장)
    → [측정 종료] → 기준 시각 표시 + 시계 시각을 사용자가 탭으로 입력
    → 일차 자동 계산
```

**방식 B: 마이크 기반 비트 측정 (Advanced Mode) - Phase 2**
1. 스마트폰 마이크로 시계의 틱 소리를 녹음
2. 오디오 신호 분석을 통해 beat error, rate 산출
3. 타임그래퍼와 유사한 결과 제공

> **MVP에서는 방식 A만 구현하고, 방식 B는 Phase 2에서 구현한다.**

#### 2.2.3 측정 결과 데이터
| 필드 | 타입 | 설명 |
|------|------|------|
| watch_id | FK | 측정 대상 시계 |
| measurement_date | datetime | 측정 일시 |
| start_time | datetime | 측정 시작 시각 |
| end_time | datetime | 측정 종료 시각 |
| reference_start | datetime | 기준 시작 시각 |
| reference_end | datetime | 기준 종료 시각 |
| watch_start | datetime | 시계 시작 시각 (사용자 입력) |
| watch_end | datetime | 시계 종료 시각 (사용자 입력) |
| daily_rate_sec | float | 일차 (초/일, +는 빠름, -는 느림) |
| position | enum | DIAL_UP / DIAL_DOWN / CROWN_UP / CROWN_DOWN / CROWN_LEFT / CROWN_RIGHT |
| notes | string | 메모 |

#### 2.2.4 측정 이력 차트
- 시계별 일차 변화 추이를 라인 차트로 표시
- 기간 필터 (1개월 / 3개월 / 6개월 / 1년 / 전체)
- 평균 일차, 최대/최소 편차 표시
- **연계**: 오버홀 이후 정밀도 변화를 시각적으로 확인 가능 (오버홀 시점에 수직선 마커 표시)

---

### 2.3 유지보수 관리 (Service Management)

#### 2.3.1 서비스 이력 등록
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| watch_id | FK | Y | 대상 시계 |
| service_type | enum | Y | OVERHAUL / POLISH / BATTERY_REPLACEMENT / BAND_REPLACEMENT / CRYSTAL_REPLACEMENT / WATER_RESISTANCE_TEST / REGULATION / OTHER |
| service_date | date | Y | 서비스 일자 |
| service_provider | string | N | 서비스 업체명 |
| cost | decimal | N | 비용 |
| currency | enum | N | 통화 |
| description | string | N | 상세 내용 |
| completed_date | date | N | 완료 일자 |
| document_photo | image[] | N | 관련 서류 사진 |
| before_daily_rate | float | N | 서비스 전 일차 (Timegrapher 연계 자동 입력 가능) |
| after_daily_rate | float | N | 서비스 후 일차 |

#### 2.3.2 오버홀 알림 시스템

**브랜드/무브먼트별 권장 오버홀 주기 데이터:**
앱 내에 주요 브랜드별 권장 오버홀 주기 사전 데이터를 내장한다.
사용자가 직접 수정 가능.

| 브랜드 | 기본 권장 주기 |
|--------|---------------|
| Rolex | 10년 |
| Omega | 5~8년 |
| Patek Philippe | 5~8년 |
| Seiko (Mechanical) | 3~5년 |
| Grand Seiko | 5년 |
| 기본값 (기계식) | 5년 |
| 기본값 (쿼츠) | 없음 (배터리 교체만) |

**알림 로직:**
```
다음 오버홀 예정일 = 마지막 오버홀 일자 + 권장 오버홀 주기
알림 시점 = 예정일 - 3개월 / 예정일 - 1개월 / 예정일
```

- 오버홀 이력이 없는 경우: 구매일 기준으로 계산
- **연계**: Timegrapher 측정에서 일차가 급격히 나빠진 경우 (ex. 이전 평균 대비 ±5초 이상 변동) 추가 오버홀 권장 알림

#### 2.3.3 보증 만료 알림
- 보증 만료일 1개월 전, 1주 전 알림
- 보증 기간 내 문제 발견 시 서비스 접수를 유도

---

### 2.4 오착 기록 (Wear Log / WOTD - Watch of the Day)

#### 2.4.1 착용 기록 등록
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| watch_id | FK | Y | 착용한 시계 |
| wear_date | date | Y | 착용 날짜 |
| photo | image[] | N | 오착 사진 (wrist shot) |
| occasion | string | N | TPO/상황 태그 (ex. 출근, 여행, 운동, 데이트) |
| strap_band | string | N | 착용한 스트랩/브레이슬릿 정보 |
| notes | string | N | 메모 |

#### 2.4.2 오착 캘린더
- 월간 캘린더 뷰에서 날짜별 착용한 시계를 아이콘/사진으로 표시
- 날짜 탭 → 해당일 착용 기록 상세 확인
- 하루에 여러 시계 착용 기록 가능 (오전/오후 교체 등)

#### 2.4.3 착용 통계
- **시계별 착용 빈도**: 바 차트 또는 파이 차트
- **월별 착용 분포**: 어떤 시계를 언제 많이 착용했는지
- **연속 미착용 경고**: 오토매틱 시계가 N일 이상 미착용 시 파워리저브 소진 알림
  - 기본값: power_reserve_hours 기반 자동 계산
  - 알림 시점: 파워리저브 소진 예상 N시간 전

---

### 2.5 대시보드 (Dashboard)

앱 진입 시 가장 먼저 보이는 메인 화면.

#### 2.5.1 구성 요소
- **오늘의 시계**: 오늘 착용 기록이 있으면 표시, 없으면 "오늘은 어떤 시계를 차시나요?" CTA
- **컬렉션 요약**: 보유 시계 수, 활성(착용중+보관중) 수
- **알림 요약**:
  - 오버홀 예정 시계 (3개월 이내)
  - 보증 만료 예정 시계
  - 진행 중인 서비스
  - 파워리저브 소진 임박 시계
- **최근 활동**: 최근 착용 기록, 측정 기록, 서비스 기록 타임라인
- **빠른 액션 버튼**:
  - 오착 기록하기
  - 측정 시작하기
  - 시계 등록하기

---

### 2.6 위시리스트 (Wish List)

#### 2.6.1 위시리스트 등록
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| brand | string | Y | 브랜드명 |
| model_name | string | Y | 모델명 |
| reference_number | string | N | 레퍼런스 넘버 |
| target_price | decimal | N | 목표 구매가 |
| currency | enum | N | 통화 |
| priority | enum | N | HIGH / MEDIUM / LOW |
| photo | image | N | 참고 사진 |
| notes | string | N | 메모 |
| added_date | date | auto | 등록일 |

#### 2.6.2 위시리스트 → 컬렉션 전환
- 위시리스트 항목을 구매 시 "구매 완료" 액션으로 컬렉션에 자동 이전
- 기존 입력 정보(브랜드, 모델명, 레퍼런스)가 자동으로 시계 등록 폼에 채워짐

---

### 2.7 알림 시스템 (Notifications)

#### 2.7.1 알림 유형
| 알림 유형 | 트리거 조건 | 기본 활성화 |
|----------|------------|-----------|
| 오버홀 예정 | 다음 오버홀 예정일 3개월/1개월 전 | Y |
| 보증 만료 | 보증 만료일 1개월/1주 전 | Y |
| 파워리저브 소진 | 오토매틱 시계 미착용으로 파워리저브 소진 예상 | Y |
| 정밀도 이상 | Timegrapher 측정 결과가 이전 평균 대비 급변 | Y |
| 오착 리마인더 | 매일 설정 시간에 "오늘의 시계" 기록 리마인드 | N (옵션) |
| 서비스 완료 | 서비스 예상 완료일 도래 | Y |

#### 2.7.2 알림 설정
- 각 알림 유형별 ON/OFF 토글
- 오착 리마인더 시간 설정 (기본 09:00)
- 푸시 알림 / 인앱 알림 선택

---

## 3. 기능 간 연계 맵

```
┌─────────────────────────────────────────────────────────────┐
│                       DASHBOARD                              │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
│  │오늘의시계│  │알림 요약  │  │컬렉션요약│  │최근 활동     │  │
│  └────┬────┘  └─────┬────┘  └────┬────┘  └──────┬───────┘  │
│       │             │            │               │           │
└───────┼─────────────┼────────────┼───────────────┼───────────┘
        │             │            │               │
        ▼             ▼            ▼               ▼
   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐
   │ 오착기록 │  │알림시스템 │  │컬렉션  │  │  타임라인    │
   │ (WOTD)  │  │          │  │        │  │             │
   └────┬────┘  └──┬───┬──┘  └───┬────┘  └─────────────┘
        │          │   │         │
        │     ┌────┘   └────┐    │
        │     ▼             ▼    │
        │  ┌──────────┐  ┌──────┴──────┐
        │  │Timegrapher│  │유지보수 관리 │
        │  │(정밀도)   │  │(서비스이력) │
        │  └─────┬────┘  └──────┬──────┘
        │        │              │
        │        └──────┬───────┘
        │               │
        └───────┬───────┘
                ▼
          ┌───────────┐
          │ 시계 상세  │  ← 모든 데이터가 시계 단위로 통합
          │ (탭 구조)  │
          └───────────┘
```

### 3.1 주요 연계 포인트

| # | 연계 | 설명 |
|---|------|------|
| 1 | 오착 → 파워리저브 | 착용 기록을 기반으로 오토매틱 시계의 마지막 착용일 추적, 파워리저브 소진 예상 계산 |
| 2 | Timegrapher → 오버홀 알림 | 정밀도 측정 결과가 급격히 나빠지면 오버홀 권장 알림 발생 |
| 3 | 서비스 이력 → Timegrapher 차트 | 오버홀/레귤레이션 시점을 차트에 마커로 표시하여 서비스 전후 정밀도 변화를 시각화 |
| 4 | 서비스 이력 → 오버홀 알림 | 마지막 오버홀 일자 + 권장 주기로 다음 오버홀 예정일 자동 계산 |
| 5 | 시계 등록 → 알림 초기화 | 시계 등록 시 무브먼트 타입과 브랜드에 따라 오버홀 알림 자동 설정 |
| 6 | 위시리스트 → 컬렉션 | 위시리스트 아이템 구매 완료 시 컬렉션으로 자동 전환 |
| 7 | 오착 → 착용 통계 | 착용 기록 데이터를 집계하여 시계별/기간별 착용 통계 생성 |
| 8 | 대시보드 → 전체 | 모든 모듈의 핵심 데이터를 대시보드에 요약 표시 |

---

## 4. 데이터 모델

### 4.1 ERD (Entity Relationship)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    User       │     │     Watch         │     │    WishList       │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │──┐  │ id (PK)          │     │ id (PK)          │
│ email        │  │  │ user_id (FK)     │     │ user_id (FK)     │
│ nickname     │  │  │ brand            │     │ brand            │
│ created_at   │  ├──│ model_name       │     │ model_name       │
│ updated_at   │  │  │ reference_number │     │ reference_number │
└──────────────┘  │  │ serial_number    │     │ target_price     │
                  │  │ caliber          │     │ priority         │
                  │  │ movement_type    │     │ notes            │
                  │  │ case_diameter_mm │     │ photo_url        │
                  │  │ case_thickness_mm│     │ added_date       │
                  │  │ lug_to_lug_mm   │     │ converted_watch_id│
                  │  │ lug_width_mm    │     └──────────────────┘
                  │  │ case_material    │
                  │  │ crystal_type     │
                  │  │ water_resistance │     ┌──────────────────┐
                  │  │ dial_color       │     │ Measurement       │
                  │  │ power_reserve_h  │     ├──────────────────┤
                  │  │ frequency_bph    │     │ id (PK)          │
                  │  │ nickname         │     │ watch_id (FK)    │──┐
                  │  │ status           │     │ measurement_date │  │
                  │  │ purchase_date    │     │ start_time       │  │
                  │  │ purchase_price   │     │ end_time         │  │
                  │  │ purchase_currency│     │ watch_start      │  │
                  │  │ purchase_channel │     │ watch_end        │  │
                  │  │ purchase_cond    │     │ daily_rate_sec   │  │
                  │  │ warranty_expiry  │     │ position         │  │
                  │  │ notes            │     │ notes            │  │
                  │  │ is_active        │     └──────────────────┘  │
                  │  │ created_at       │                           │
                  │  │ updated_at       │     ┌──────────────────┐  │
                  │  └───────┬──────────┘     │ ServiceRecord     │  │
                  │          │                ├──────────────────┤  │
                  │          │                │ id (PK)          │  │
                  │          │                │ watch_id (FK)    │──┤
                  │          │                │ service_type     │  │
                  │          │                │ service_date     │  │
                  │          │                │ service_provider │  │
                  │          │                │ cost             │  │
                  │          │                │ currency         │  │
                  │          │                │ description      │  │
                  │          │                │ completed_date   │  │
                  │          │                │ before_rate      │  │
                  │          │                │ after_rate       │  │
                  │          │                └──────────────────┘  │
                  │          │                                      │
                  │          │                ┌──────────────────┐  │
                  │          │                │ WearLog           │  │
                  │          │                ├──────────────────┤  │
                  │          │                │ id (PK)          │  │
                  │          └────────────────│ watch_id (FK)    │──┘
                  │                           │ wear_date        │
                  └───────────────────────────│ user_id (FK)     │
                                              │ occasion         │
                                              │ strap_band       │
                                              │ notes            │
                                              └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ WatchPhoto        │     │ OverhaulSchedule  │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ watch_id (FK)    │     │ brand_pattern    │
│ photo_type       │     │ movement_type    │
│ photo_url        │     │ interval_months  │
│ caption          │     │ is_user_custom   │
│ created_at       │     │ user_id (FK)     │
└──────────────────┘     └──────────────────┘

┌──────────────────┐
│ Notification      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ watch_id (FK)    │
│ type             │
│ title            │
│ message          │
│ is_read          │
│ scheduled_at     │
│ created_at       │
└──────────────────┘
```

### 4.2 테이블 관계 요약
- `User` 1:N `Watch` - 사용자는 여러 시계를 보유
- `Watch` 1:N `Measurement` - 시계별 여러 번의 정밀도 측정
- `Watch` 1:N `ServiceRecord` - 시계별 여러 번의 서비스 이력
- `Watch` 1:N `WearLog` - 시계별 여러 번의 착용 기록
- `Watch` 1:N `WatchPhoto` - 시계별 여러 사진 (스펙사진, 오착사진, 서류사진)
- `User` 1:N `WishList` - 사용자별 위시리스트
- `User` 1:N `Notification` - 사용자별 알림

---

## 5. 화면 구조 (Screen Map)

### 5.1 네비게이션 구조

```
Bottom Tab Navigation
├── 대시보드 (Home)
│   ├── 오늘의 시계
│   ├── 알림 요약
│   ├── 컬렉션 요약
│   └── 최근 활동 타임라인
│
├── 컬렉션 (Collection)
│   ├── 시계 목록 (그리드/리스트)
│   ├── 시계 등록/편집 폼
│   └── 시계 상세
│       ├── 스펙 탭
│       ├── 정밀도 탭 (측정 이력 차트)
│       ├── 유지보수 탭 (서비스 이력)
│       └── 착용 기록 탭
│
├── 오착 (WOTD)
│   ├── 오착 캘린더
│   ├── 오착 등록
│   └── 착용 통계
│
├── Timegrapher
│   ├── 시계 선택
│   ├── 측정 화면 (시작/종료)
│   └── 측정 결과
│
└── 더보기 (More)
    ├── 위시리스트
    ├── 알림 목록
    ├── 알림 설정
    ├── 오버홀 주기 설정
    ├── 데이터 백업/복원
    └── 앱 설정 (테마, 언어 등)
```

### 5.2 핵심 화면 와이어프레임 설명

#### 대시보드 (Home)
```
┌─────────────────────────────┐
│  Watch Manager         🔔   │ ← 상단 앱바 + 알림 아이콘
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   오늘의 시계            │ │ ← 카드: 오늘 착용 시계 사진 + 이름
│ │   [Rolex Submariner]    │ │    또는 "오늘은 어떤 시계?" CTA
│ └─────────────────────────┘ │
│                             │
│ ⚠️ 알림 (2)                │ ← 섹션: 주의가 필요한 알림 요약
│ ┌────────────┬────────────┐ │
│ │오버홀 예정  │파워리저브   │ │
│ │Omega 1건   │Seiko 1건   │ │
│ └────────────┴────────────┘ │
│                             │
│ 내 컬렉션 (5)         전체> │ ← 가로 스크롤 시계 썸네일
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ │🕐│ │🕐│ │🕐│ │🕐│ │🕐│  │
│ └──┘ └──┘ └──┘ └──┘ └──┘  │
│                             │
│ 최근 활동                   │ ← 타임라인
│ · 3/4 Submariner 착용       │
│ · 3/3 Speedmaster 측정 +2s  │
│ · 3/1 SKX007 오버홀 완료    │
│                             │
│  [➕ 오착]  [⏱ 측정]  [⌚ 등록] │ ← FAB 또는 Quick Action
├─────────────────────────────┤
│ 🏠  📋  📸  ⏱  ⋯          │ ← Bottom Tab
└─────────────────────────────┘
```

#### 시계 상세 화면
```
┌─────────────────────────────┐
│  ← Submariner 124060   ✏️  │ ← 앱바: 뒤로가기 + 편집
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [시계 대표 사진]      │ │ ← 사진 캐러셀
│ │                         │ │
│ └─────────────────────────┘ │
│  Rolex Submariner           │
│  Ref. 124060 | Automatic    │
│  상태: 착용중               │
├─────────────────────────────┤
│ [스펙] [정밀도] [유지보수] [착용] │ ← 탭 바
├─────────────────────────────┤
│                             │
│  (선택된 탭의 컨텐츠)        │
│                             │
│  -- 정밀도 탭 예시 --        │
│  일차 변화 추이              │
│  ┌─────────────────────┐   │
│  │  📈 +3  +2  +5  +3  │   │ ← 라인 차트
│  │     ──────|─────── │   │    (| = 오버홀 시점)
│  │          오버홀      │   │
│  └─────────────────────┘   │
│  평균 일차: +3.2 sec/day    │
│  최근 측정: 2026-03-01      │
│                             │
│  [측정 시작하기]            │ ← CTA 버튼
└─────────────────────────────┘
```

---

## 6. 비기능 요구사항

### 6.1 기술 스택 (권장)
| 항목 | 선택지 | 비고 |
|------|--------|------|
| Framework | React Native (Expo) 또는 Flutter | 크로스 플랫폼 |
| Language | TypeScript (RN) 또는 Dart (Flutter) | |
| Local DB | SQLite (via Drizzle/WatermelonDB) 또는 Realm | 오프라인 우선 |
| Backend | Supabase 또는 Firebase | 인증 + 클라우드 동기화 |
| Push Notification | Firebase Cloud Messaging | |
| Image Storage | Supabase Storage 또는 Firebase Storage | |
| Chart | Victory Native 또는 fl_chart | |

### 6.2 오프라인 우선 설계
- 모든 핵심 기능은 오프라인에서도 동작해야 한다
- 로컬 DB에 먼저 저장 후 네트워크 연결 시 클라우드 동기화
- 이미지는 로컬 저장 + 백그라운드 업로드

### 6.3 데이터 백업
- 클라우드 자동 동기화 (로그인 사용자)
- JSON/CSV 내보내기 기능
- 사진 포함 전체 백업/복원

### 6.4 성능 요구사항
- 시계 목록 로딩: 100개 기준 < 1초
- 차트 렌더링: 1년 데이터 기준 < 2초
- 앱 콜드 스타트: < 3초
- 이미지 최적화: 업로드 시 자동 리사이징 (max 1920px)

### 6.5 보안
- 사용자 데이터 암호화 (at rest)
- 인증: Email/Password + Social Login (Google, Apple)
- 민감 정보 (시리얼 넘버, 구매가) 선택적 잠금 (생체인증)

---

## 7. 개발 로드맵

### Phase 1 - MVP (8~10주)
- [x] 시계 등록/편집/삭제 (Collection CRUD)
- [x] 시계 목록 (그리드/리스트 뷰, 검색, 필터)
- [x] 시계 상세 화면 (탭 구조)
- [x] Timegrapher 수동 측정 (Simple Mode)
- [x] 측정 이력 관리 + 차트
- [x] 서비스 이력 관리
- [x] 오버홀 알림 (기본)
- [x] 오착 기록 + 캘린더 뷰
- [x] 대시보드
- [x] 로컬 DB 저장

### Phase 2 - 확장 (4~6주)
- [ ] 클라우드 동기화 (인증 + 백업)
- [ ] 위시리스트
- [ ] 착용 통계 (차트)
- [ ] 알림 시스템 고도화 (푸시 알림)
- [ ] 보증 만료 알림
- [ ] 파워리저브 소진 알림
- [ ] 데이터 내보내기 (JSON/CSV)

### Phase 3 - 고급 기능 (6~8주)
- [ ] Timegrapher 마이크 기반 측정 (Advanced Mode)
- [ ] 컬렉션 통계 대시보드 (총 가치, 브랜드 분포)
- [ ] 위시리스트 → 컬렉션 전환 플로우
- [ ] 다국어 지원
- [ ] 다크 모드
- [ ] 위젯 (오늘의 시계)

---

## 8. 용어 사전 (Glossary)

| 용어 | 설명 |
|------|------|
| Timegrapher | 기계식 시계의 정밀도(일차, 비트에러)를 측정하는 장비 또는 해당 기능 |
| Daily Rate (일차) | 시계가 하루에 빨라지거나 느려지는 초 단위의 오차. +는 빠름, -는 느림 |
| Beat Error | 시계 밸런스 휠의 좌우 진동 불균형 정도 (ms) |
| Overhaul (오버홀) | 시계를 완전 분해하여 세척, 주유, 재조립하는 종합 점검 |
| Power Reserve | 태엽이 완전히 감긴 상태에서 시계가 작동할 수 있는 최대 시간 |
| BPH (Beats Per Hour) | 시간당 진동수. 일반적: 21600(6bps), 28800(8bps), 36000(10bps) |
| Complication | 시간 표시 외의 추가 기능 (날짜, 크로노그래프, GMT, 문페이즈 등) |
| Lug-to-Lug | 시계 케이스의 러그 끝에서 끝까지의 수직 길이 |
| Lug Width | 스트랩/브레이슬릿이 장착되는 러그 사이의 간격 |
| Crystal | 시계 유리 (사파이어, 미네랄, 아크릴, 하드렉스) |
| Regulation (레귤레이션) | 시계의 정밀도를 조정하는 작업 |
| AD (Authorized Dealer) | 브랜드 공식 판매점 |
| 오착 | "오늘의 착용(샷)"의 줄임말. 시계 커뮤니티에서 당일 착용한 시계를 공유하는 문화 |
| WOTD | Watch of the Day. 오착의 영문 표현 |
| Wrist Shot | 시계를 착용한 손목 사진 |

---

## 9. 개발 가이드라인

### 9.1 프로젝트 구조 (React Native 기준)
```
src/
├── app/                    # 네비게이션 및 화면 라우팅
│   ├── (tabs)/             # Bottom Tab 화면들
│   │   ├── dashboard/
│   │   ├── collection/
│   │   ├── wotd/
│   │   ├── timegrapher/
│   │   └── more/
│   └── modals/             # 모달 화면들
├── components/             # 재사용 UI 컴포넌트
│   ├── common/             # 버튼, 카드, 인풋 등 공통
│   ├── watch/              # 시계 관련 컴포넌트
│   ├── measurement/        # 측정 관련 컴포넌트
│   └── chart/              # 차트 컴포넌트
├── database/               # 로컬 DB 스키마 및 쿼리
│   ├── schema/
│   ├── migrations/
│   └── queries/
├── services/               # 비즈니스 로직
│   ├── watch.service.ts
│   ├── measurement.service.ts
│   ├── service-record.service.ts
│   ├── wear-log.service.ts
│   ├── notification.service.ts
│   └── overhaul-schedule.service.ts
├── hooks/                  # Custom React Hooks
├── utils/                  # 유틸리티 함수
│   ├── date.ts
│   ├── calculation.ts      # 일차 계산 등
│   └── image.ts
├── constants/              # 상수 (오버홀 주기, enum 값 등)
├── types/                  # TypeScript 타입 정의
└── assets/                 # 정적 리소스
```

### 9.2 핵심 비즈니스 로직

#### 일차(Daily Rate) 계산
```
daily_rate = ((watch_elapsed - reference_elapsed) / reference_elapsed) * 86400

where:
  watch_elapsed = watch_end - watch_start (seconds)
  reference_elapsed = reference_end - reference_start (seconds)
  86400 = seconds in a day
```

#### 파워리저브 소진 예상
```
last_wear_date = 해당 시계의 가장 최근 WearLog.wear_date
power_reserve = Watch.power_reserve_hours

estimated_stop_time = last_wear_date + power_reserve (hours)
alert_time = estimated_stop_time - 6 hours (기본값)
```

#### 오버홀 예정일 계산
```
last_overhaul = ServiceRecord에서 service_type='OVERHAUL'인 가장 최근 레코드의 service_date
                (없으면 Watch.purchase_date 사용)
interval = OverhaulSchedule에서 해당 브랜드/무브먼트의 interval_months

next_overhaul = last_overhaul + interval months
```

#### 정밀도 이상 감지
```
recent_measurements = 최근 5회 측정의 daily_rate_sec
average = mean(recent_measurements)
latest = 가장 최근 측정의 daily_rate_sec

if abs(latest - average) > 5.0:
    trigger "정밀도 이상 알림"
```

### 9.3 코딩 컨벤션
- 변수/함수명: camelCase
- 타입/인터페이스: PascalCase
- 상수: UPPER_SNAKE_CASE
- 파일명: kebab-case
- 컴포넌트 파일명: PascalCase
- DB 컬럼명: snake_case
- 모든 함수에 TypeScript 타입 명시
- 비즈니스 로직은 서비스 레이어에 분리
