# 📋 AfterGrow API 명세서 (구현 기준)

> 이 문서는 기획 단계의 API 명세서가 아니라, **실제로 구현된 코드**(`jungkathon3teamBE`, 컨트롤러/서비스/DTO)를 기준으로 역산해서 작성한 명세서입니다.
> 원래 명세서와 다르게 구현된 부분은 각 항목에 ⚠️로 표시했습니다.
>
> - 기준 버전: `AfterGrow API v0.0.1` (`OpenApiConfig` 기준)
> - Base URL: `http://localhost:8080` (로컬) / 배포 도메인은 별도 확인 필요
> - Swagger UI: `/swagger-ui.html`
> - 최초 작성: 2026-08-15 · 최신화: 2026-08-16 · **최신화: 2026-08-17** (변경 내역은 문서 맨 아래 [변경 이력](#변경-이력) 참고)

---

## 0. 공통 사항

### 0.1 인증

- 방식: `Authorization: Bearer {accessToken}` 헤더
- 토큰 없이 호출 가능한 경로(그 외 전부 인증 필요):
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /actuator/health`
  - `/swagger-ui/**`, `/v3/api-docs/**`
- ⚠️ `POST /auth/logout`은 `/auth/**`이지만 **인증이 필요**합니다 — 누구를 로그아웃시킬지 알아야 하기 때문입니다.
- ⚠️ `GET /running-sessions/prepare`도 인증이 필요합니다(공개 경로 목록에 없음). 컨트롤러가 `userId`를 사용하지는 않지만 토큰 검증 자체는 통과해야 합니다.
- `GET /weather/uv-forecast`도 마찬가지로 인증이 필요합니다(신설, `SecurityConfig`는 변경되지 않음).

### 0.2 공통 응답 포맷

모든 API는 아래 포맷으로 감싸져 내려갑니다.

```json
{
  "success": true,
  "data": { /* 실제 응답 데이터 */ },
  "error": null
}
```

실패 시:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "E4010",
    "message": "인증 토큰이 없거나 만료되었습니다."
  }
}
```

### 0.3 공통 에러 코드

| 코드 | HTTP 상태 | 의미 |
|---|---|---|
| `E4001` | 400 | 요청 값이 유효하지 않음 (검증 실패, JSON 파싱 실패, 경로 변수 타입 불일치, range 형식 오류 등) |
| `E4010` | 401 | 인증 토큰이 없거나 만료됨 / refresh 토큰이 이미 무효화됨 |
| `E4011` | 401 | 로그인 시 이메일 또는 비밀번호 불일치 (둘을 구분하지 않음) |
| `E4030` | 403 | 권한 없음 — **다른 사용자 소유의 리소스에 접근 시에도 404가 아니라 이 코드**를 반환 (존재 여부 비노출 목적) |
| `E4040` | 404 | 요청한 리소스를 찾을 수 없음 / 매핑되지 않은 경로 |
| `E4090` | 409 | 이미 진행 중인 러닝 세션이 있음 (러닝 중복 시작) |
| `E4091` | 409 | 이미 사용 중인 이메일 (회원가입 중복) |
| `E5000` | 500 | 서버 내부 오류 |
| `E5010` | 502 | 애플 헬스 데이터를 가져오지 못함 |
| `E5011` | 502 | 자외선 예보(기상청)를 가져오지 못함 *(신규)* |

> 검증 실패(`@Valid`)는 여러 필드가 잘못돼도 **첫 번째 위반 필드의 메시지만** `E4001`로 내려갑니다.
> *(신규)* 필수 쿼리 파라미터가 아예 빠졌을 때(예: `lat`/`lng` 누락)도 이제 `500`이 아니라 `400 E4001`로 정확히 응답합니다. `@Min`/`@Max` 같은 파라미터 제약 위반도 동일하게 `E4001`입니다.

### 0.4 Enum 정의

| Enum | 값 | 사용처 |
|---|---|---|
| `HeartRateSource` | `WATCH`, `RPPG` | 심박수 측정 방식 |
| `SignalQuality` | `GOOD`, `POOR` | rPPG 신호 품질 (워치 측정은 해당 없음 → `null`) |
| `SyncStatus` | `SUCCESS`, `FAILED` | 측정 기록 저장 성공 여부 (`POOR` 신호면 `FAILED`) |
| `Intensity` | `LOW`, `MODERATE`, `HIGH` | 러닝 강도 |
| `RunningStatus` | `IN_PROGRESS`, `ENDED`, `COMPLETED` | 러닝 세션 상태 (시작→종료→리포트 확정 순서) |
| `StretchingType` | `PRE_RUN` | 스트레칭 종류 (현재는 러닝 전 하나뿐) |
| `RecoveryActionType` 🔄 | `HYDRATION`, `COOLDOWN`, `CLEANSING`, `SOOTHING`, `UV_CARE`, `MOISTURIZING` | 회복 액션 종류. **2026-08-17 전면 개편** — 기존 3종(운동 쿨다운 중심)에서 스킨케어 6종으로 교체됨(아래 5.1, 변경 이력 참고) |
| `GoalType` | `FITNESS`, `WEIGHT_LOSS`, `RACE_TRAINING`, `STRESS_RELIEF` | 러닝 목적. 과거 자유 문자열이었던 `goalType`이 이 enum으로 고정됨 |

---

## 1. 인증 — `/auth`

### 1.1 회원가입

`POST /auth/signup` — 인증 불필요 · 성공 시 `201 Created`

> 🆕 약관 동의 필드(`agreeTerms`/`agreePrivacy`/`agreeMarketing`)가 추가되었고, 응답에 **토큰이 함께 발급**되도록 바뀌었습니다(아래 참고).

**Request Body**

```json
{
  "email": "runner@example.com",
  "password": "password123",
  "nickname": "달리는사람",
  "agreeTerms": true,
  "agreePrivacy": true,
  "agreeMarketing": false
}
```

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| email | string | ✅ | 이메일 형식, 최대 255자 |
| password | string | ✅ | 8~64자 |
| nickname | string | ✅ | 최대 100자 |
| agreeTerms 🆕 | boolean | ✅ | `true`가 아니면(생략 포함) `E4001` — 이용약관 동의 필수 |
| agreePrivacy 🆕 | boolean | ✅ | `true`가 아니면(생략 포함) `E4001` — 개인정보처리방침 동의 필수 |
| agreeMarketing 🆕 | boolean | ❌ | 생략하면 미동의로 처리 |

**Response**

```json
{
  "success": true,
  "data": {
    "userId": "b7e2...uuid",
    "email": "runner@example.com",
    "nickname": "달리는사람",
    "createdAt": "2026-08-15T10:00:00",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600
  },
  "error": null
}
```

> 🆕 `accessToken`/`refreshToken`/`expiresIn`이 응답에 추가됨 — 온보딩(목표 설정 등)이 가입 직후 바로 이어지므로, 클라이언트가 `POST /auth/login`을 한 번 더 호출할 필요가 없습니다. 로그인과 동일하게 refresh 토큰이 Redis에도 저장되어 로그아웃으로 무효화할 수 있습니다.

**에러**: 이메일 중복 시 `409 E4091` · 검증 실패(약관 미동의 포함) 시 `400 E4001`

---

### 1.2 로그인

`POST /auth/login` — 인증 불필요 · `200 OK`

**Request Body**

```json
{ "email": "runner@example.com", "password": "password123" }
```

**Response**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600
  },
  "error": null
}
```

**에러**: 이메일/비밀번호 불일치 시 `401 E4011` (둘을 구분하지 않음)

---

### 1.3 액세스 토큰 재발급

`POST /auth/refresh` — 인증 불필요(대신 body로 refreshToken 전달) · `200 OK`

**Request Body**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response**

```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOi...", "expiresIn": 3600 },
  "error": null
}
```

**에러**: 서명/만료/타입 불일치, 또는 로그아웃·재로그인으로 이미 교체된 토큰이면 `401 E4010`
(Redis에 저장된 최신 refresh 토큰과 일치하는지까지 검증합니다.)

---

### 1.4 로그아웃

`POST /auth/logout` — **인증 필요** · 성공 시 `204 No Content` (본문 없음)

- 저장된 refresh 토큰을 Redis에서 삭제합니다.
- ⚠️ 이미 발급된 access 토큰은 만료 전까지는 계속 유효합니다(JWT는 즉시 취소 불가). access 토큰 수명이 1시간으로 짧은 이유이기도 합니다.

---

## 2. 홈 대시보드 — `/home`

### 2.1 홈 요약 조회

`GET /home` — 인증 필요 · `200 OK`

화면 2 진입 시 인사말, 주간 목표, 최근 측정, 오늘 러닝 상태, 주간 요약을 한 번에 반환합니다.

**Response**

```json
{
  "success": true,
  "data": {
    "greeting": "안녕하세요, 달리는사람님",
    "weeklyRunCount": 2,
    "weeklyGoalCount": 3,
    "remainingToGoal": 1,
    "latestMeasurement": {
      "heartRateSource": "RPPG",
      "avgBpm": 132,
      "measuredAt": "2026-08-14T18:32:00"
    },
    "todayRunningStatus": "NOT_STARTED",
    "weeklySummary": {
      "totalDistanceKm": 8.4,
      "avgBpm": 128,
      "cumulativeUvLevel": "높음"
    }
  },
  "error": null
}
```

| 필드 | 설명 |
|---|---|
| `weeklyRunCount` / `weeklyGoalCount` / `remainingToGoal` | 이번 주(월~일) 완료 세션 수 대비 목표. 목표 미설정 시 0 |
| `latestMeasurement` | 성공(`SUCCESS`)한 측정 중 가장 최근 것. 없으면 `null` (실패 기록은 제외) |
| `todayRunningStatus` | `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` 중 하나 |
| `weeklySummary.cumulativeUvLevel` | 이번 주 완료 세션들의 평균 UV 지수를 레벨 문자열로 환산 (측정 없으면 `null`) |

> `IN_PROGRESS`와 `ENDED`/`COMPLETED` 세션 모두 "완료"로 집계에 포함됩니다(`ENDED`, `COMPLETED` 상태 기준).

---

## 3. 러닝 세션 — `/running-sessions`, `/stretching-sessions`

### 3.1 러닝 준비 정보 조회

`GET /running-sessions/prepare?lat={lat}&lng={lng}` — 인증 필요 · `200 OK`

| 쿼리 파라미터 | 타입 | 필수 |
|---|---|---|
| lat | double | ✅ |
| lng | double | ✅ |

**Response**

```json
{
  "success": true,
  "data": {
    "locationLabel": "서울특별시 서대문구",
    "uvIndex": 8,
    "uvLevel": "매우 높음",
    "goodTimeToRun": false,
    "stretching": {
      "title": "출발 전 스트레칭",
      "optional": true,
      "description": "발목·종아리 위주 3분 루틴"
    }
  },
  "error": null
}
```

- `goodTimeToRun`은 UV 지수가 **7 미만**일 때 `true`
- UV 레벨 구간: `0~2` 낮음 / `3~5` 보통 / `6~7` 높음 / `8~10` 매우 높음 / `11+` 위험

---

### 3.2 스트레칭 시작 (선택)

`POST /stretching-sessions` — 인증 필요 · `201 Created`

**Request Body**

```json
{ "type": "PRE_RUN" }
```

**Response**

```json
{
  "success": true,
  "data": { "stretchingSessionId": "uuid", "startedAt": "2026-08-15T08:00:00" },
  "error": null
}
```

---

### 3.3 러닝 시작

`POST /running-sessions` — 인증 필요 · `201 Created`

**Request Body**

```json
{
  "startedAt": "2026-08-15T08:10:00",
  "location": { "lat": 37.5665, "lng": 126.9780 },
  "uvIndexAtStart": 8
}
```

**Response**

```json
{
  "success": true,
  "data": { "runningSessionId": "uuid", "status": "IN_PROGRESS" },
  "error": null
}
```

**에러**: 이미 `IN_PROGRESS` 상태 세션이 있으면 `409 E4090` (사용자당 동시 진행 세션 1개 제한)

---

### 3.4 러닝 진행 중 조회 (폴링)

`GET /running-sessions/{id}/live?distanceKm={distanceKm}&intensity={intensity}` — 인증 필요 · `200 OK`

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| distanceKm | double | ❌ | 클라이언트가 로컬 트래킹값을 함께 보낼 때만. 보내면 세션 스냅샷이 갱신됨 |
| intensity | Intensity | ❌ | 위와 동일 |

**Response**

```json
{
  "success": true,
  "data": {
    "runningSessionId": "uuid",
    "elapsedSec": 754,
    "intensity": "MODERATE",
    "distanceKm": 1.8,
    "heartRateStatus": "PENDING_AFTER_FINISH",
    "stressStatus": "PENDING_HRV_CALCULATION",
    "uvIndex": 8,
    "uvLevel": "매우 높음"
  },
  "error": null
}
```

- `heartRateStatus`/`stressStatus`는 항상 고정 문자열입니다(러닝 중엔 심박수·스트레스를 계산하지 않고, 종료 후 확인).
- `uvIndex`/`uvLevel`은 세션 시작 시 저장된 위경도로 **매 호출마다 다시 조회**합니다(실시간 값).

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

### 3.5 러닝 종료

`POST /running-sessions/{id}/end` — 인증 필요 · `200 OK`

> 🆕 GPS 경로(`routePath`)를 함께 보낼 수 있게 되었습니다.

**Request Body**

```json
{
  "endedAt": "2026-08-15T08:35:00",
  "durationSec": 1500,
  "distanceKm": 3.2,
  "intensity": "MODERATE",
  "routePath": [
    { "lat": 37.5665, "lng": 126.9780, "t": 0 },
    { "lat": 37.5672, "lng": 126.9791, "t": 8 },
    { "lat": 37.5688, "lng": 126.9812, "t": 17 }
  ]
}
```

| 필드 | 검증 |
|---|---|
| endedAt | 필수 |
| durationSec | 필수, 양수 |
| distanceKm | 필수, 0 이상 |
| intensity | 필수 |
| routePath 🆕 | 선택. 러닝 중 수집한 GPS 트랙 배열(최대 10,000점). 안 보내면 경로 없이 종료됩니다 |

- `routePath`의 각 점: `lat`(위도, -90~90), `lng`(경도, -180~180), `t`(러닝 시작부터 경과 초, 0 이상) 모두 필수.
- 🆕 경로는 **종료 시점에 배열 전체를 한 번에** 보냅니다(러닝 중에는 전송하지 않음). 지도를 그릴 계획이면 반드시 보내야 합니다 — 안 보내면 나중에 복원할 수 없습니다.
- 🆕 `routePath`를 생략하면 기존에 저장된 경로가 있어도 지워지지 않습니다(값이 없을 때만 유지, 빈 배열과는 다름).

**Response**

```json
{
  "success": true,
  "data": {
    "runningSessionId": "uuid",
    "status": "ENDED",
    "nextStep": "HEART_RATE_CHECK",
    "defaultHeartRateSource": "RPPG"
  },
  "error": null
}
```

- `defaultHeartRateSource`: 화면 5(심박수 측정 방식 선택)에서 기본으로 선택해 둘 값. 최근 측정 이력 → 없으면 애플 헬스 연동 여부 순으로 유추(별도 저장 컬럼 없음).
- ⚠️ **idempotent**: 이미 `ENDED`/`COMPLETED` 상태인 세션에 다시 호출해도 에러 없이 현재 상태를 그대로 반환합니다(중복 클릭·재시도 대응).

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

### 3.6 러닝 기록 목록 🆕

`GET /running-sessions?range={Nd}` — 인증 필요 · `200 OK`

러닝 기록(History) 화면용 목록 조회입니다. 4.7(심박수 측정 기록 목록)과 같은 `range` 규칙(`"{일수}d"`, 기본 `30d`)을 씁니다.

| 쿼리 파라미터 | 필수 | 형식 |
|---|---|---|
| range | ❌ | `"{일수}d"`. 생략 시 기본 `30d` |

**Response**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "runningSessionId": "uuid",
        "startedAt": "2026-08-16T07:00:00",
        "endedAt": "2026-08-16T07:24:12",
        "durationSec": 1452,
        "distanceKm": 4.8,
        "intensity": "MODERATE",
        "status": "COMPLETED",
        "uvIndexAtStart": 5,
        "avgBpm": 138,
        "hasRoutePath": true
      }
    ],
    "summary": { "totalCount": 12, "totalDistanceKm": 42.35, "totalDurationSec": 18400 }
  }
}
```

- 목록에는 **GPS 경로(`routePath`)가 포함되지 않습니다** — 세션당 수백 점이라 목록에 실으면 응답이 커집니다. 경로는 상세 조회(3.7)에서만 내려갑니다.
- `hasRoutePath`: 경로가 저장돼 있는지 여부. 목록에서 "지도 보기" 버튼 노출 여부를 정하는 용도.
- `avgBpm`: 해당 세션의 최근 성공 측정 평균 bpm(없으면 `null`).
- `IN_PROGRESS` 상태 세션도 목록에 포함됩니다("달리는 중"으로 표시 가능).
- `summary`는 `range` 전체 기준 집계입니다(홈 대시보드의 "이번 주" 집계와는 기준이 다름에 유의).

**에러**: `range` 형식 오류 시 `400 E4001`

---

### 3.7 러닝 기록 상세 🆕

`GET /running-sessions/{id}` — 인증 필요 · `200 OK`

지도에 그릴 GPS 경로(`routePath`)가 포함된 상세 조회입니다.

> ⚠️ 경로가 `/running-sessions/prepare`(3.1)와 같은 상위 경로를 쓰지만, Spring이 리터럴 경로(`prepare`)를 `{id}` 템플릿보다 먼저 매칭하고 `id`가 UUID 타입이라 실제로 충돌하지 않습니다.

**Response**

```json
{
  "success": true,
  "data": {
    "runningSessionId": "uuid",
    "startedAt": "2026-08-16T07:00:00",
    "endedAt": "2026-08-16T07:24:12",
    "durationSec": 1452,
    "distanceKm": 4.8,
    "intensity": "MODERATE",
    "status": "COMPLETED",
    "uvIndexAtStart": 5,
    "startLocation": { "lat": 37.5665, "lng": 126.9780 },
    "routePath": [
      { "lat": 37.5665, "lng": 126.9780, "t": 0 },
      { "lat": 37.5672, "lng": 126.9791, "t": 8 }
    ],
    "heartRate": {
      "heartRateSource": "RPPG",
      "avgBpm": 138,
      "maxBpm": 155,
      "hrvMs": 38,
      "measuredAt": "2026-08-16T07:25:00"
    },
    "preRunStretching": { "type": "PRE_RUN", "startedAt": "2026-08-16T06:52:00" }
  }
}
```

- `routePath`: 경로 없이 종료한 세션은 `null`.
- `heartRate`: 해당 세션의 최근 "성공" 측정 1건. 없으면 `null`.
- `preRunStretching`: 이 러닝 직전에 한 스트레칭. **추정값**입니다 — 스트레칭 세션이 러닝 세션과 FK로 연결돼 있지 않아 시각 근접도(러닝 시작 60분 이내 중 가장 최근)로 골라냅니다. 짧은 간격으로 러닝을 두 번 하면 같은 스트레칭이 두 러닝에 붙을 수 있습니다. 스트레칭을 안 했으면 `null`.

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

## 4. 심박수 측정 — `/running-sessions/{id}/heart-rate`, `/integrations/apple-health`, `/heart-rate-measurements`

### 4.1 심박수 측정 방식 선택

`POST /running-sessions/{id}/heart-rate/select-source` — 인증 필요 · `200 OK`

화면 5에서 워치/rPPG 중 하나를 고르면 다음 화면을 알려줍니다. **선택값 자체는 저장되지 않습니다**(이후 실제 측정 흐름이 각자 source를 확정).

**Request Body**

```json
{ "heartRateSource": "WATCH" }
```

**Response**

```json
{
  "success": true,
  "data": { "heartRateSource": "WATCH", "nextStep": "FETCH_APPLE_HEALTH" }
}
```

- `heartRateSource`가 `WATCH`면 `nextStep: "FETCH_APPLE_HEALTH"`, `RPPG`면 `nextStep: "RPPG_GUIDE"`

---

### 4.2 애플 헬스 — 워치 심박수 업로드

`POST /integrations/apple-health/heart-rate` — 인증 필요 · `201 Created`

> ⚠️ **원 명세와 다르게 구현됨**: 명세서는 서버가 HealthKit을 직접 조회하는 `GET`이었지만, HealthKit은 온디바이스 API라 서버가 읽을 수 없습니다. 앱이 HealthKit에서 읽은 값을 서버로 올리는 `POST` 구조로 바뀌었습니다.

**Request Body**

```json
{
  "runningSessionId": "uuid",
  "avgBpm": 145,
  "maxBpm": 168,
  "hrvMs": 42,
  "syncedAt": "2026-08-15T08:36:00"
}
```

| 필드 | 필수 | 검증 |
|---|---|---|
| runningSessionId | ✅ | |
| avgBpm | ✅ | 양수 |
| maxBpm | ✅ | 양수 |
| hrvMs | ❌ | |
| syncedAt | ✅ | |

**Response**

```json
{
  "success": true,
  "data": {
    "heartRateMeasurementId": "uuid",
    "heartRateSource": "WATCH",
    "avgBpm": 145,
    "maxBpm": 168,
    "hrvMs": 42,
    "syncStatus": "SUCCESS"
  }
}
```

- 워치 업로드는 앱이 읽기에 성공했을 때만 호출되므로 항상 `syncStatus: "SUCCESS"`입니다.

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

### 4.3 애플 헬스 연동 상태 기록

`POST /integrations/apple-health/link` — 인증 필요 · `200 OK`

> ⚠️ **원 명세와 다르게 구현됨**: HealthKit 권한 동의는 OS 다이얼로그로 끝나 서버가 돌려줄 `authorizeUrl`이 없습니다. 앱이 동의 결과(또는 iOS 설정에서의 권한 회수)를 알려오면 그대로 기록만 합니다.

**Request Body**

```json
{ "linked": true }
```

**Response**

```json
{ "success": true, "data": { "appleHealthLinked": true } }
```

---

### 4.4 rPPG 측정 안내

`GET /heart-rate-measurements/rppg/guide` — 인증 필요 · `200 OK`

화면 6 진입 시 고정 안내 문구를 반환합니다.

**Response**

```json
{
  "success": true,
  "data": {
    "instruction": "후면 카메라와 플래시에 손가락을 밀착시켜 약 12초간 측정해요",
    "durationSec": 12
  }
}
```

---

### 4.5 rPPG 측정 시작

`POST /heart-rate-measurements/rppg/start` — 인증 필요 · `201 Created`

측정 세션 ID를 발급합니다. **이 시점엔 DB에 아무것도 쓰지 않으며**, Redis에 `rppgSessionId → runningSessionId` 매핑만 저장합니다. 실제 측정 기록은 결과 제출(4.6)에서 처음 생성됩니다.

**Request Body**

```json
{ "runningSessionId": "uuid" }
```

**Response**

```json
{
  "success": true,
  "data": { "rppgSessionId": "uuid", "status": "MEASURING", "durationSec": 12 }
}
```

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

### 4.6 rPPG 측정 결과 제출

`POST /heart-rate-measurements/rppg/{rppgSessionId}/result` — 인증 필요 · `201 Created`

카메라 원본 영상은 서버로 전송되지 않고, **온디바이스 알고리즘이 계산한 결과값만** 전송됩니다.

**Request Body**

```json
{
  "avgBpm": 138,
  "maxBpm": 155,
  "hrvMs": 38,
  "measuredAt": "2026-08-15T08:37:00",
  "signalQuality": "GOOD"
}
```

| 필드 | 필수 | 검증 |
|---|---|---|
| avgBpm | ✅ | 양수 |
| maxBpm | ✅ | 양수 |
| hrvMs | ❌ | |
| measuredAt | ✅ | |
| signalQuality | ✅ | `GOOD` \| `POOR` |

**Response (성공)**

```json
{
  "success": true,
  "data": {
    "heartRateMeasurementId": "uuid",
    "heartRateSource": "RPPG",
    "avgBpm": 138,
    "maxBpm": 155,
    "hrvMs": 38,
    "syncStatus": "SUCCESS"
  }
}
```

**Response (`signalQuality: "POOR"`인 경우)** — 이 경우도 에러가 아니라 **`201`**로 응답하며, bpm/hrv는 저장 자체가 되지 않고 `null`로 내려갑니다(재측정이 필요한 기록으로 취급).

```json
{
  "success": true,
  "data": {
    "heartRateMeasurementId": "uuid",
    "heartRateSource": "RPPG",
    "avgBpm": null,
    "maxBpm": null,
    "hrvMs": null,
    "syncStatus": "FAILED"
  }
}
```

**에러**: `rppgSessionId`가 만료됐거나, 이미 제출에 사용됐거나, 애초에 없던 값이면 `404 E4040`. (Redis에서 원자적으로 조회+삭제하므로 같은 `rppgSessionId`로 두 번 제출할 수 없습니다.)

---

### 4.7 심박수 측정 기록 목록 조회

`GET /heart-rate-measurements?range={Nd}` — 인증 필요 · `200 OK`

| 쿼리 파라미터 | 필수 | 형식 |
|---|---|---|
| range | ❌ | `"{일수}d"` (예: `"30d"`). 생략 시 기본 `30d`. 주/월 단위는 지원하지 않음 |

**Response**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "heartRateMeasurementId": "uuid",
        "measuredAt": "2026-08-15T08:37:00",
        "heartRateSource": "RPPG",
        "avgBpm": 138,
        "runningSessionId": "uuid",
        "syncStatus": "SUCCESS"
      },
      {
        "heartRateMeasurementId": "uuid2",
        "measuredAt": "2026-08-14T18:32:00",
        "heartRateSource": "RPPG",
        "avgBpm": null,
        "runningSessionId": "uuid3",
        "syncStatus": "FAILED"
      }
    ],
    "sourceRatio": { "watch": 3, "rppg": 5, "rppgFailedCount": 1 }
  }
}
```

- 최신순 정렬, 실패(`FAILED`) 기록도 목록에 그대로 포함됩니다(화면 8에서 재측정 유도용).
- `sourceRatio.rppgFailedCount`는 `rppg`의 부분집합입니다(별도 항목이 아님).

**에러**: `range` 형식이 `"{숫자}d"`가 아니거나 0 이하 숫자면 `400 E4001`

---

### 4.8 실패 기록 재측정

`POST /heart-rate-measurements/{id}/retry` — 인증 필요 · `200 OK`

실패 기록은 삭제하지 않고, 다시 rPPG 흐름(4.4~4.6)을 태울 수 있도록 정보만 반환합니다.

**Response**

```json
{ "success": true, "data": { "retryFlow": "RPPG_GUIDE", "runningSessionId": "uuid" } }
```

- ⚠️ `syncStatus`가 `FAILED`가 아닌(이미 성공한) 기록에 호출해도 막지 않습니다.

**에러**: 측정 기록 없음 `404 E4040` · 남의 기록 `403 E4030`

---

## 5. 회복 가이드 — `/running-sessions/{id}/recovery-guide`, `/recovery-guides`, `/running-sessions/{id}/complete`

### 5.1 AI 회복 가이드 생성

`POST /running-sessions/{id}/recovery-guide` — 인증 필요 · `201 Created`

화면 7 진입 시, 세션의 강도·거리·러닝 시간·시작 시점 UV 지수·심박수 측정 결과(있다면)를 종합해 AI가 **피부 회복 가이드**를 생성합니다.

> 🔄 **2026-08-17 액션 체계 전면 개편**: 기존에는 "운동 쿨다운"(스트레칭 위주) 관점이었지만, 이제는 **UV 노출과 발한이 피부에 미치는 영향**을 근거로 한 스킨케어 코칭으로 바뀌었습니다. 요청/응답 스키마(필드 이름)는 그대로이고, **`actions[].type`에 들어가는 값만 바뀌었습니다.**

**Response**

```json
{
  "success": true,
  "data": {
    "recoveryGuideId": "uuid",
    "measuredBpm": 168,
    "summaryMessage": "높은 강도로 8km를 55분간 달려 자외선 노출과 열감이 모두 컸어요. 진정 케어와 수분 보충을 서둘러 챙기세요.",
    "actions": [
      { "type": "HYDRATION", "title": "수분 보충", "description": "물 600ml 이상을 15분 내로 나눠 마셔 전해질 균형을 맞춰주세요" },
      { "type": "COOLDOWN", "title": "심박 안정화", "description": "그늘에서 5~10분간 걸으며 심박수를 낮춘 뒤 스킨케어를 시작하세요" },
      { "type": "CLEANSING", "title": "세안", "description": "귀가 후 15분 이내 약산성 클렌저로 땀과 피지를 씻어내세요" },
      { "type": "UV_CARE", "title": "자외선 진정 케어", "description": "시원한 물로 홍반을 가라앉힌 뒤 자외선 차단제를 다시 발라주세요" },
      { "type": "MOISTURIZING", "title": "보습", "description": "세안 직후 무자극 수분크림으로 마무리해 손상된 장벽을 보호하세요" }
    ],
    "cooldownTimerSec": 540
  }
}
```

- `measuredBpm`: 해당 세션의 성공(`SUCCESS`)한 측정 중 가장 최근 값. 측정 이력이 없으면 `null`.
- `cooldownTimerSec`: 60~900초 사이로 방어적으로 clamp됨(기본값 300초). "쿨다운 후 스킨케어 착수까지의 대기시간" 의미로, 5.2에서 그대로 내려줍니다.

**`actions[].type` 6종과 포함 규칙** 🔄

| type | 의미 | 포함 조건 |
|---|---|---|
| `HYDRATION` | 수분 보충 | 항상 포함 |
| `CLEANSING` | 세안 | 항상 포함 |
| `MOISTURIZING` | 보습 | 항상 포함 |
| `COOLDOWN` | 심박을 진정시킨 뒤 스킨케어 착수(운동 쿨다운이 아님) | 운동 강도가 높거나(`HIGH`) 장거리(≥5km)일 때 |
| `UV_CARE` | 자외선 손상 케어 | **UV 노출량 등급**이 "높음" 이상일 때 |
| `SOOTHING` | 홍조·열감 진정 | 운동 강도는 높은데 UV 노출은 낮을 때(`UV_CARE`가 이미 포함되면 생략될 수 있음) |

- 🔄 **UV 판단 기준이 "순간 지수"에서 "노출량(dose)"으로 바뀌었습니다.** 이전에는 `uvIndexAtStart`가 특정 값 이상이면 무조건 UV 액션을 추가했지만, 지금은 `UV 노출량 = uvIndexAtStart × (durationSec / 3600)`으로 계산한 **누적 노출량**을 기준으로 판단합니다 — "UV 9에 10분만 뛴 경우"와 "UV 4에 90분 뛴 경우"를 구분하기 위함입니다. 등급은 낮음(<2) / 보통(2~5) / 높음(5~8) / 매우 높음(8+) 4단계.
- 실제 생성 로직은 두 단계입니다: **1순위로 OpenAI**(`gpt-4o-mini`, 구조화된 JSON 응답 + few-shot 예시 3쌍)를 호출하고, `openai.api-key`가 비어있거나 호출이 실패(네트워크 오류·타임아웃·5xx·형식 오류 등)하면 **조용히 규칙 기반(Mock) 생성기로 폴백**합니다. 화면 7 진입 자체가 AI 응답 하나 때문에 막히지 않도록 하기 위함이며, 클라이언트 입장에서는 어느 쪽이 응답했는지 구분할 수 없습니다.
- AI가 의약품 추천·질환명 언급·진단, 근거 없는 과장(예: "피부암 위험"), 특정 브랜드명을 쓰지 않도록 시스템 프롬프트에 명시되어 있습니다.
- ⚠️ **idempotent**: 세션당 가이드는 하나뿐(1:0..1, UNIQUE 제약)이라, 이미 생성된 세션에 다시 호출하면 재생성하지 않고 **기존 가이드를 그대로** 반환합니다. 즉, 이 개편 이전에 이미 생성된 가이드는 계속 옛 3종 값(`COOLDOWN_STRETCH`/`UV_CAUTION`)을 갖고 있을 수 있습니다 — 아래 부록 D 참고.

**에러**: 세션 없음 `404 E4040` · 남의 세션 `403 E4030`

---

### 5.2 쿨다운 타이머 시작

`POST /recovery-guides/{id}/cooldown-timer/start` — 인증 필요 · `200 OK`

회복 가이드 생성 직후 호출합니다. **실제 타이머는 클라이언트가 로컬로 돌리며**, 서버는 길이를 확인해주고 시작 시각만 내려줄 뿐 별도 상태를 저장하지 않습니다.

**Response**

```json
{ "success": true, "data": { "cooldownTimerSec": 300, "startedAt": "2026-08-15T08:45:00" } }
```

**에러**: 가이드 없음 `404 E4040` · 남의 가이드 `403 E4030`

---

### 5.3 세션 완료 & 리포트 확정

`POST /running-sessions/{id}/complete` — 인증 필요 · `200 OK`

화면 7의 "완료하고 리포트 보기" 버튼. **회복 가이드가 먼저 생성되어 있어야** 합니다(5.1을 건너뛰면 404).

**Response**

```json
{ "success": true, "data": { "runningSessionId": "uuid", "status": "COMPLETED", "reportId": "uuid" } }
```

- `reportId`: 원 명세엔 별도 리포트 리소스가 있지만, ERD에 Report 엔티티가 없어 `recoveryGuideId`를 그대로 재사용합니다.

**에러**: 세션 없음 또는 가이드 미생성 시 `404 E4040` · 남의 세션 `403 E4030`

---

## 6. 프로필 & 설정 — `/users/me`

### 6.1 프로필 조회

`GET /users/me/profile` — 인증 필요 · `200 OK`

닉네임·목표·연동 상태·알림 설정을 한 번에 반환합니다. 설정 행이 아직 없는 사용자도 에러 없이 기본값(목표/알림은 필드 `null`, 연동은 전부 `false`)으로 조회됩니다.

**Response**

```json
{
  "success": true,
  "data": {
    "nickname": "달리는사람",
    "goal": { "goalType": "FITNESS", "weeklyRunGoal": 3 },
    "integrations": {
      "cameraPermission": true,
      "locationPermission": true,
      "appleHealthLinked": false
    },
    "notifications": {
      "runningReminderTime": "07:00:00",
      "weeklyReportDay": "SUNDAY",
      "weeklyReportTime": "20:00:00"
    }
  }
}
```

> 🆕 `goal.goalType`이 자유 문자열에서 **`GoalType` enum**(`FITNESS`/`WEIGHT_LOSS`/`RACE_TRAINING`/`STRESS_RELIEF`)으로 고정되었습니다. 과거 예시값이던 `"WEEKLY_DISTANCE"`는 "목적"이 아니라 "목표 산정 기준(거리 vs 횟수)"을 뜻하는 다른 개념이라 후보에서 제외되었고, 기존 데이터는 마이그레이션으로 `null`(미설정)로 정리되었습니다.
> 🆕 `integrations.locationLinked` 필드가 응답에서 **빠졌습니다** — 값을 채우는 경로가 없어 항상 `false`만 내려가던 필드였고, `locationPermission`과 의미가 구분되지 않아 제거되었습니다(DB 컬럼 자체는 남아있어 추후 부활 가능).

---

### 6.2 목표 수정

`PATCH /users/me/goal` — 인증 필요 · `200 OK`

**부분 수정** — 요청에 담긴 필드만 바뀌고, 생략된(`null`인) 필드는 기존값을 유지합니다. 목표 행이 없던 사용자는 이 호출로 새로 생성됩니다(upsert).

> 🆕 `goalType`이 자유 문자열에서 `GoalType` enum으로 바뀌었습니다. 후보 4개(`FITNESS`/`WEIGHT_LOSS`/`RACE_TRAINING`/`STRESS_RELIEF`) 밖의 값을 보내면 역직렬화 단계에서 `400 E4001`입니다.

**Request Body**

```json
{ "goalType": "RACE_TRAINING", "weeklyRunGoal": 4 }
```

| 필드 | 필수 | 검증 |
|---|---|---|
| goalType | ❌ | `GoalType` enum 값 중 하나 (`FITNESS`/`WEIGHT_LOSS`/`RACE_TRAINING`/`STRESS_RELIEF`) |
| weeklyRunGoal | ❌ | 0 이상 (음수면 `E4001`). 주간 **횟수**이며 거리 아님 |

**Response**

```json
{
  "success": true,
  "data": { "goalType": "RACE_TRAINING", "weeklyRunGoal": 4, "updatedAt": "2026-08-15T09:00:00" }
}
```

---

### 6.3 연동/권한 상태 조회

`GET /users/me/integrations` — 인증 필요 · `200 OK`

**Response**

```json
{
  "success": true,
  "data": {
    "cameraPermission": true,
    "locationPermission": true,
    "appleHealthLinked": false
  }
}
```

> 🆕 `locationLinked` 필드가 응답에서 빠졌습니다(6.1 참고).

---

### 6.4 연동/권한 상태 갱신 🆕

`PATCH /users/me/integrations` — 인증 필요 · `200 OK`

조회(6.3)만 있고 쓰기가 없던 공백을 메운 신규 엔드포인트입니다. 브라우저에서 실제로 카메라/위치 권한을 요청한 결과를 서버에 동기화하는 용도입니다.

**부분 수정** — 두 필드 모두 nullable이며 보낸 필드만 바뀝니다.

**Request Body**

```json
{ "cameraPermission": true, "locationPermission": false }
```

| 필드 | 필수 |
|---|---|
| cameraPermission | ❌ |
| locationPermission | ❌ |

**Response**

```json
{
  "success": true,
  "data": { "cameraPermission": true, "locationPermission": false, "appleHealthLinked": false }
}
```

> ⚠️ 저장되는 값은 **표시용 캐시일 뿐 권한 검증 수단이 아닙니다.** 클라이언트는 기능 진입 시 항상 실제 브라우저 권한 API를 다시 호출해 그 순간의 성공/실패로 판단해야 하며, 이 API는 그 결과를 프로필 화면에 보여주기 위한 동기화 용도입니다.
> `appleHealthLinked`는 이 API로 다루지 않습니다 — 4.3 `POST /integrations/apple-health/link`가 담당합니다.

---

### 6.5 알림 설정 변경

`PATCH /users/me/notifications` — 인증 필요 · `200 OK`

**부분 수정** — 세 필드 모두 nullable이며 보낸 필드만 바뀝니다. 설정 행이 없던 사용자는 upsert됩니다.

**Request Body**

```json
{ "runningReminderTime": "07:00", "weeklyReportDay": "SUNDAY", "weeklyReportTime": "20:00" }
```

| 필드 | 형식 |
|---|---|
| runningReminderTime | `"HH:mm"` |
| weeklyReportDay | 영문 요일 (`"SUNDAY"` 등, `DayOfWeek`) |
| weeklyReportTime | `"HH:mm"` |

**Response**

```json
{
  "success": true,
  "data": { "runningReminderTime": "07:00:00", "weeklyReportDay": "SUNDAY", "weeklyReportTime": "20:00:00" }
}
```

---

### 6.6 회원 탈퇴 🆕

`DELETE /users/me` — 인증 필요 · 성공 시 `204 No Content` (본문 없음)

계정과 딸린 모든 데이터(목표·알림·연동상태·러닝 세션·심박수 측정·회복 가이드/액션)가 **DB `ON DELETE CASCADE`로 함께 삭제**됩니다. 되돌릴 수 없습니다.

**Request Body**

```json
{ "password": "password123" }
```

| 필드 | 필수 | 설명 |
|---|---|---|
| password | ✅ | 현재 비밀번호. 탈취된 access 토큰만으로 실행되지 않도록 재확인 |

- 비밀번호가 틀리면 로그인과 동일하게 `401 E4011`.
- 저장된 refresh 토큰도 함께 삭제되어 재발급이 즉시 막힙니다.
- ⚠️ 이미 발급된 access 토큰은 만료 전까지 서명 검증 자체는 통과합니다(JWT는 즉시 취소 불가). 다만 사용자 행이 사라져 이후 대부분의 API가 `404 E4040`으로 응답합니다.
- 컨트롤러상으로는 `ProfileController`(`/users/me`)에 있지만, 비밀번호 확인·refresh 토큰 정리는 내부적으로 인증 도메인(`AuthService`)이 처리합니다.

**에러**: 비밀번호 불일치 `401 E4011`

---

## 7. 날씨 — `/weather` 🆕

### 7.1 시간대별 UV 예보 🆕

`GET /weather/uv-forecast?lat={lat}&lng={lng}` — 인증 필요 · `200 OK`

홈 화면의 UV 그래프용 신규 엔드포인트입니다. 러닝 세션과 무관하게 "이 위치의 오늘 하루 UV 예보"를 반환합니다("지금 UV"와 "UV가 낮은 추천 시간대"도 이 배열 하나로 클라이언트가 계산할 수 있어 별도 API가 없습니다).

| 쿼리 파라미터 | 타입 | 필수 | 검증 |
|---|---|---|---|
| lat | double | ✅ | -90~90 |
| lng | double | ✅ | -180~180 |

**Response**

```json
{
  "success": true,
  "data": {
    "hourly": [
      { "hour": "00", "uv": 0 },
      { "hour": "02", "uv": 0 },
      { "hour": "04", "uv": 0 },
      { "hour": "06", "uv": 1 },
      { "hour": "08", "uv": 3 },
      { "hour": "10", "uv": 6 },
      { "hour": "12", "uv": 9 },
      { "hour": "14", "uv": 8 },
      { "hour": "16", "uv": 5 },
      { "hour": "18", "uv": 2 },
      { "hour": "20", "uv": 0 },
      { "hour": "22", "uv": 0 }
    ]
  },
  "error": null
}
```

- `hourly`는 오늘 00시부터 **2시간 간격 12개**로 항상 같은 길이입니다.
- 내부적으로 위경도를 기상청 행정구역코드(시군구 단위)로 변환해 조회하며, **같은 시군구의 모든 사용자가 Redis 캐시(6시간 TTL)를 공유**합니다 — 요청에 개인정보가 들어가지 않습니다.
- 기상청 서비스키(`kma.auth-key`)가 설정되지 않은 환경(CI 등)에서는 모의(mock) 값으로 응답합니다.
- 러닝 준비 화면(3.1)의 "지금 UV"는 이 API와 별개로 `UvIndexClient`가 담당합니다(하루 전체 그래프용과 현재값용 클라이언트가 분리되어 있음).

**에러**: `lat`/`lng` 누락·범위 초과 시 `400 E4001` · 기상청 응답 실패 시 `502 E5011`

---

## 부록 A. 엔드포인트 요약표

| # | Method | Path | 인증 | 성공 코드 | 설명 |
|---|---|---|---|---|---|
| 1.1 | POST | `/auth/signup` | ❌ | 201 | 회원가입 |
| 1.2 | POST | `/auth/login` | ❌ | 200 | 로그인 |
| 1.3 | POST | `/auth/refresh` | ❌ | 200 | 액세스 토큰 재발급 |
| 1.4 | POST | `/auth/logout` | ✅ | 204 | 로그아웃 |
| 2.1 | GET | `/home` | ✅ | 200 | 홈 요약 조회 |
| 3.1 | GET | `/running-sessions/prepare` | ✅ | 200 | 러닝 준비 정보(UV/위치/스트레칭 안내) |
| 3.2 | POST | `/stretching-sessions` | ✅ | 201 | 스트레칭 시작 |
| 3.3 | POST | `/running-sessions` | ✅ | 201 | 러닝 시작 |
| 3.4 | GET | `/running-sessions/{id}/live` | ✅ | 200 | 러닝 진행 중 조회(폴링) |
| 3.5 | POST | `/running-sessions/{id}/end` | ✅ | 200 | 러닝 종료 |
| 3.6 🆕 | GET | `/running-sessions` | ✅ | 200 | 러닝 기록 목록 |
| 3.7 🆕 | GET | `/running-sessions/{id}` | ✅ | 200 | 러닝 기록 상세(GPS 경로 포함) |
| 4.1 | POST | `/running-sessions/{id}/heart-rate/select-source` | ✅ | 200 | 심박수 측정 방식 선택 |
| 4.2 | POST | `/integrations/apple-health/heart-rate` | ✅ | 201 | 워치 심박수 업로드 |
| 4.3 | POST | `/integrations/apple-health/link` | ✅ | 200 | 애플 헬스 연동 기록 |
| 4.4 | GET | `/heart-rate-measurements/rppg/guide` | ✅ | 200 | rPPG 측정 안내 |
| 4.5 | POST | `/heart-rate-measurements/rppg/start` | ✅ | 201 | rPPG 측정 시작 |
| 4.6 | POST | `/heart-rate-measurements/rppg/{rppgSessionId}/result` | ✅ | 201 | rPPG 측정 결과 제출 |
| 4.7 | GET | `/heart-rate-measurements` | ✅ | 200 | 측정 기록 목록 |
| 4.8 | POST | `/heart-rate-measurements/{id}/retry` | ✅ | 200 | 실패 기록 재측정 |
| 5.1 | POST | `/running-sessions/{id}/recovery-guide` | ✅ | 201 | AI 회복 가이드 생성 |
| 5.2 | POST | `/recovery-guides/{id}/cooldown-timer/start` | ✅ | 200 | 쿨다운 타이머 시작 |
| 5.3 | POST | `/running-sessions/{id}/complete` | ✅ | 200 | 세션 완료 & 리포트 확정 |
| 6.1 | GET | `/users/me/profile` | ✅ | 200 | 프로필 조회 |
| 6.2 | PATCH | `/users/me/goal` | ✅ | 200 | 목표 수정 |
| 6.3 | GET | `/users/me/integrations` | ✅ | 200 | 연동/권한 상태 조회 |
| 6.4 🆕 | PATCH | `/users/me/integrations` | ✅ | 200 | 연동/권한 상태 갱신 |
| 6.5 | PATCH | `/users/me/notifications` | ✅ | 200 | 알림 설정 변경 |
| 6.6 🆕 | DELETE | `/users/me` | ✅ | 204 | 회원 탈퇴 |
| 7.1 🆕 | GET | `/weather/uv-forecast` | ✅ | 200 | 시간대별 UV 예보 |

총 **30개** 엔드포인트 (기존 25개 + 신규 5개).

## 부록 B. 화면 ↔ API 매핑

| 화면 | 관련 API |
|---|---|
| 1. 회원가입/로그인 | 1.1, 1.2, 1.3, 1.4 |
| 2. 홈 대시보드 | 2.1, 7.1 🆕(UV 그래프) |
| 3. 러닝 준비 | 3.1, 3.2 |
| 4. 러닝 진행 | 3.3, 3.4, 3.5 |
| 5. 심박수 측정 방식 선택 | 4.1 |
| 4/6. 워치·rPPG 측정 | 4.2, 4.3, 4.4, 4.5, 4.6 |
| 7. 회복 가이드 / 리포트 | 5.1, 5.2, 5.3 |
| 8. 측정 기록 / 재측정 | 4.7, 4.8 |
| (신규) 러닝 기록(History) | 3.6 🆕, 3.7 🆕 |
| 9. 프로필 / 설정 | 6.1, 6.2, 6.3, 6.4 🆕, 6.5, 6.6 🆕 |

## 부록 C. 원 명세서와 달라진 주요 지점

코드 주석(Javadoc)에 명시적으로 남겨진, 기획 단계 명세와 실제 구현이 갈라진 지점만 모았습니다.

1. **애플 헬스 연동(4.2, 4.3)**: 원래 서버가 HealthKit을 직접 읽는 `GET`으로 설계됐지만, HealthKit이 온디바이스 전용 API라 서버가 접근할 수 없어 **앱이 값을 올리는 `POST`**로 바뀜.
2. **회복 가이드 생성(5.1) / 러닝 종료(3.5)**: 명세에 없던 **idempotent 처리**를 추가함(중복 클릭·화면 재진입 시 에러 대신 기존 결과 반환).
3. **`RunningEndDto.Response.defaultHeartRateSource`**: 명세에는 없지만 화면 요구사항을 충족하기 위해 임의로 추가한 응답 필드.
4. **소유권 오류 코드**: 남의 리소스(세션/가이드/측정기록) 접근 시 `404`가 아니라 **`403 E4030`**으로 통일(리소스 존재 여부 비노출).
5. **`RunningCompleteResponse.reportId`**: 별도 Report 엔티티가 ERD에 없어 `recoveryGuideId`를 재사용.
6. **회원 탈퇴(6.6)의 위치**: 계정 조작이라 성격상 `/auth/**`에 있을 법하지만, 실제로는 `/users/me`(`ProfileController`)의 `DELETE`로 구현되어 있고 내부적으로만 `AuthService.withdraw()`를 호출함.
7. **회원가입 응답에 토큰 포함(1.1)**: 일반적으로 가입과 로그인 응답 스키마를 분리하지만, 여기서는 온보딩 흐름상 가입 직후 로그인이 항상 뒤따르므로 `SignupResponse`에 로그인 응답 필드를 합침.
8. 🔄 **회복 가이드(5.1)의 성격 자체가 바뀜**: 원래 "운동 쿨다운" 관점(`COOLDOWN_STRETCH`, `UV_CAUTION`)이었으나, `docs/피부회복가이드_프롬프트.md` 설계에 맞춰 **UV·발한이 피부에 미치는 영향을 근거로 한 스킨케어 코칭**으로 전면 개편됨(6개 액션 타입, UV 노출량 기반 판단). API 스키마는 동일하고 `actions[].type`의 값 집합만 바뀜.

## 부록 D. 확인이 필요한 부분

- 배포 서버 Base URL 확정 필요 (현재는 로컬 `localhost:8080` 기준)
- ~~`UserGoal.goalType`의 고정 enum 후보값 (현재는 자유 문자열)~~ → **2026-08-16 해결**: `GoalType` enum 4종으로 고정됨(0.4, 6.2 참고)
- ~~`lat`/`lng` 누락 시 500으로 떨어질 가능성~~ → **2026-08-16 해결**: `MissingServletRequestParameterException`/`HandlerMethodValidationException` 전용 핸들러가 추가되어 정확히 `400 E4001`을 반환함
- 🆕 `application-local.yml`에 기상청(KMA) 서비스키(`kma.auth-key`)가 평문으로 포함되어 있습니다. OpenAI 키와 마찬가지로 `.gitignore` 대상 파일이지만, 과거 커밋 이력이나 다른 경로로 유출된 적이 있는지 확인하고 필요시 재발급을 권장합니다.
- 🆕 배포 환경(`application-prod.yml`)에서 `KMA_AUTH_KEY` 환경변수 주입 방식 확정 필요.
- 🆕 `weather.external.KmaUvForecastClient`의 실패 조건(타임아웃/파싱 오류 등) 및 `E5011` 재시도 정책 별도 확인 필요.
- 🔄 **레거시 회복 가이드 데이터**: 5.1의 idempotent 처리 때문에, 2026-08-17 개편 이전에 이미 생성된 `RECOVERY_ACTIONS` 행은 옛 값(`COOLDOWN_STRETCH`, `UV_CAUTION`)을 그대로 갖고 있습니다. `RecoveryActionType`이 DB상 자유 문자열(VARCHAR)이라 조회 시 에러는 나지 않지만, 프론트에서 6종 외 값이 내려올 가능성을 처리해야 합니다. 데이터 마이그레이션 여부 팀 논의 필요.
- `application-local.yml`의 OpenAI API 키가 이번에 재발급된 것으로 보이나(이전 안내 반영), 여전히 파일에 평문으로 하드코딩되어 있습니다 — 배포 전 Secrets Manager 등으로의 이전을 권장합니다.

---

## 변경 이력

### 2026-08-17 — 회복 가이드 "솔루션" 개편

최신 코드(`jungkathon3teamBE__8_.zip`) 기준. **이번 델타는 회복 가이드(R5) 도메인에만 집중**되어 있고, 다른 엔드포인트는 변경 없음(엔드포인트 총 개수 30개 그대로).

- 🔄 **`RecoveryActionType` 전면 교체** — `HYDRATION`/`COOLDOWN_STRETCH`/`UV_CAUTION`(3종, 운동 쿨다운 관점) → `HYDRATION`/`COOLDOWN`/`CLEANSING`/`SOOTHING`/`UV_CARE`/`MOISTURIZING`(6종, 스킨케어 코칭 관점)
- 🔄 **UV 판단 기준 변경** — 순간 UV 지수 임계값 방식 → `uvIndexAtStart × (durationSec/3600)`로 계산한 **UV 노출량(dose)** 4단계 등급 방식
- 🔄 **AI 프롬프트 재작성** — 시스템 프롬프트가 "러닝 앱 피부 회복 코치"로 재정의됨, few-shot 예시 3쌍(고UV+고강도 / 저부하 / 고강도+저UV) 추가로 응답 톤·액션 선택 안정화
- 🆕 `RecoveryGuideAiClient.Context`에 `durationSec` 필드 추가(UV 노출량 계산에 필요)
- OpenAI API 키 재발급(값 교체) — `application-local.yml`에 여전히 평문 하드코딩(부록 D 참고)
- API 요청/응답 스키마(필드 이름, HTTP 메서드/경로) 자체는 변경 없음 — `actions[].type`에 담기는 **값의 종류만** 바뀜

### 2026-08-16 — 신규 엔드포인트 5종 + 스키마 정리

최신 코드(`jungkathon3teamBE__7_.zip`) 기준으로 전체 재검토 후 최신화. 이전 버전(2026-08-15) 대비 변경 사항 요약:

#### 신규 엔드포인트 (5개)
- `GET /running-sessions` — 러닝 기록 목록 (3.6)
- `GET /running-sessions/{id}` — 러닝 기록 상세, GPS 경로 포함 (3.7)
- `PATCH /users/me/integrations` — 카메라/위치 권한 상태 갱신 (6.4)
- `DELETE /users/me` — 회원 탈퇴 (6.6)
- `GET /weather/uv-forecast` — 시간대별 UV 예보, 신규 `weather` 도메인 (7.1)

#### 기존 엔드포인트 변경
- **회원가입(1.1)**: 약관 동의 필드(`agreeTerms`/`agreePrivacy`/`agreeMarketing`) 필수화, 응답에 `accessToken`/`refreshToken`/`expiresIn` 추가(가입 직후 자동 로그인)
- **러닝 종료(3.5)**: 요청에 GPS 경로(`routePath`, 최대 10,000점) 선택 필드 추가
- **목표 수정(6.2)** / **프로필 조회(6.1)**: `goalType`이 자유 문자열 → `GoalType` enum(`FITNESS`/`WEIGHT_LOSS`/`RACE_TRAINING`/`STRESS_RELIEF`) 4종으로 고정
- **연동 상태 조회(6.3)** / **프로필 조회(6.1)**: 응답에서 `integrations.locationLinked` 필드 제거

#### 공통/버그 수정
- 신규 에러 코드 `E5011`(자외선 예보 조회 실패, 502) 추가
- 필수 쿼리 파라미터 누락 시 이전에는 `500`으로 떨어질 위험이 있었으나, 전용 예외 핸들러 추가로 정확히 `400 E4001` 반환하도록 수정

#### 문서에는 반영하지 않은 내부 리팩터링
- `range`(`"{일수}d"`) 파싱 로직을 `RangeParam` 공통 클래스로 추출(심박수 기록 목록과 러닝 기록 목록이 공유) — API 동작에는 변화 없음
