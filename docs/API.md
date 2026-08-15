# 📋 AfterGrow API 명세서 (구현 기준)

> 이 문서는 기획 단계의 API 명세서가 아니라, **실제로 구현된 코드**(`jungkathon3teamBE`, 컨트롤러/서비스/DTO)를 기준으로 역산해서 작성한 명세서입니다.
> 원래 명세서와 다르게 구현된 부분은 각 항목에 ⚠️로 표시했습니다.
>
> - 기준 버전: `AfterGrow API v0.0.1` (`OpenApiConfig` 기준)
> - Base URL: `http://localhost:8080` (로컬) / 배포 도메인은 별도 확인 필요
> - Swagger UI: `/swagger-ui.html`
> - 최종 정리: 2026-08-15

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

> 검증 실패(`@Valid`)는 여러 필드가 잘못돼도 **첫 번째 위반 필드의 메시지만** `E4001`로 내려갑니다.

### 0.4 Enum 정의

| Enum | 값 | 사용처 |
|---|---|---|
| `HeartRateSource` | `WATCH`, `RPPG` | 심박수 측정 방식 |
| `SignalQuality` | `GOOD`, `POOR` | rPPG 신호 품질 (워치 측정은 해당 없음 → `null`) |
| `SyncStatus` | `SUCCESS`, `FAILED` | 측정 기록 저장 성공 여부 (`POOR` 신호면 `FAILED`) |
| `Intensity` | `LOW`, `MODERATE`, `HIGH` | 러닝 강도 |
| `RunningStatus` | `IN_PROGRESS`, `ENDED`, `COMPLETED` | 러닝 세션 상태 (시작→종료→리포트 확정 순서) |
| `StretchingType` | `PRE_RUN` | 스트레칭 종류 (현재는 러닝 전 하나뿐) |
| `RecoveryActionType` | `HYDRATION`, `COOLDOWN_STRETCH`, `UV_CAUTION` | 회복 액션 종류 (DB는 자유 문자열이라 향후 추가 가능) |

---

## 1. 인증 — `/auth`

### 1.1 회원가입

`POST /auth/signup` — 인증 불필요 · 성공 시 `201 Created`

**Request Body**

```json
{
  "email": "runner@example.com",
  "password": "password123",
  "nickname": "달리는사람"
}
```

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| email | string | ✅ | 이메일 형식, 최대 255자 |
| password | string | ✅ | 8~64자 |
| nickname | string | ✅ | 최대 100자 |

**Response**

```json
{
  "success": true,
  "data": {
    "userId": "b7e2...uuid",
    "email": "runner@example.com",
    "nickname": "달리는사람",
    "createdAt": "2026-08-15T10:00:00"
  },
  "error": null
}
```

**에러**: 이메일 중복 시 `409 E4091` · 검증 실패 시 `400 E4001`

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

**Request Body**

```json
{
  "endedAt": "2026-08-15T08:35:00",
  "durationSec": 1500,
  "distanceKm": 3.2,
  "intensity": "MODERATE"
}
```

| 필드 | 검증 |
|---|---|
| endedAt | 필수 |
| durationSec | 필수, 양수 |
| distanceKm | 필수, 0 이상 |
| intensity | 필수 |

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

화면 7 진입 시, 세션의 강도·거리·시작 시점 UV 지수·심박수 측정 결과(있다면)를 종합해 AI가 회복 가이드를 생성합니다.

**Response**

```json
{
  "success": true,
  "data": {
    "recoveryGuideId": "uuid",
    "measuredBpm": 138,
    "summaryMessage": "강도 높은 러닝이었어요. 수분 보충과 쿨다운을 챙겨주세요.",
    "actions": [
      { "type": "HYDRATION", "title": "수분 보충", "description": "물 500ml를 천천히 나눠 마셔요" },
      { "type": "COOLDOWN_STRETCH", "title": "쿨다운 스트레칭", "description": "종아리·햄스트링 위주 5분" },
      { "type": "UV_CAUTION", "title": "자외선 주의", "description": "UV 지수가 높았어요. 자외선 차단 케어를 챙기세요" }
    ],
    "cooldownTimerSec": 300
  }
}
```

- `measuredBpm`: 해당 세션의 성공(`SUCCESS`)한 측정 중 가장 최근 값. 측정 이력이 없으면 `null`.
- `UV_CAUTION` 액션은 러닝 시작 시점 UV 지수가 높았을 때만 추가됩니다(원 명세엔 없던 항목).
- ⚠️ **idempotent**: 세션당 가이드는 하나뿐(1:0..1, UNIQUE 제약)이라, 이미 생성된 세션에 다시 호출하면 재생성하지 않고 **기존 가이드를 그대로** 반환합니다.

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
    "goal": { "goalType": "WEEKLY_DISTANCE", "weeklyRunGoal": 3 },
    "integrations": {
      "locationLinked": true,
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

> `goal.goalType`은 DB상 자유 문자열(VARCHAR)이며 현재 고정된 enum 후보값은 정해져 있지 않습니다.

---

### 6.2 목표 수정

`PATCH /users/me/goal` — 인증 필요 · `200 OK`

**부분 수정** — 요청에 담긴 필드만 바뀌고, 생략된(`null`인) 필드는 기존값을 유지합니다. 목표 행이 없던 사용자는 이 호출로 새로 생성됩니다(upsert).

**Request Body**

```json
{ "goalType": "WEEKLY_DISTANCE", "weeklyRunGoal": 4 }
```

| 필드 | 필수 | 검증 |
|---|---|---|
| goalType | ❌ | |
| weeklyRunGoal | ❌ | 0 이상 (음수면 `E4001`) |

**Response**

```json
{
  "success": true,
  "data": { "goalType": "WEEKLY_DISTANCE", "weeklyRunGoal": 4, "updatedAt": "2026-08-15T09:00:00" }
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
    "locationLinked": true,
    "cameraPermission": true,
    "locationPermission": true,
    "appleHealthLinked": false
  }
}
```

---

### 6.4 알림 설정 변경

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
| 6.4 | PATCH | `/users/me/notifications` | ✅ | 200 | 알림 설정 변경 |

총 **25개** 엔드포인트.

## 부록 B. 화면 ↔ API 매핑

| 화면 | 관련 API |
|---|---|
| 1. 회원가입/로그인 | 1.1, 1.2, 1.3, 1.4 |
| 2. 홈 대시보드 | 2.1 |
| 3. 러닝 준비 | 3.1, 3.2 |
| 4. 러닝 진행 | 3.3, 3.4, 3.5 |
| 5. 심박수 측정 방식 선택 | 4.1 |
| 4/6. 워치·rPPG 측정 | 4.2, 4.3, 4.4, 4.5, 4.6 |
| 7. 회복 가이드 / 리포트 | 5.1, 5.2, 5.3 |
| 8. 측정 기록 / 재측정 | 4.7, 4.8 |
| 9. 프로필 / 설정 | 6.1, 6.2, 6.3, 6.4 |

## 부록 C. 원 명세서와 달라진 주요 지점

코드 주석(Javadoc)에 명시적으로 남겨진, 기획 단계 명세와 실제 구현이 갈라진 지점만 모았습니다.

1. **애플 헬스 연동(4.2, 4.3)**: 원래 서버가 HealthKit을 직접 읽는 `GET`으로 설계됐지만, HealthKit이 온디바이스 전용 API라 서버가 접근할 수 없어 **앱이 값을 올리는 `POST`**로 바뀜.
2. **회복 가이드 생성(5.1) / 러닝 종료(3.5)**: 명세에 없던 **idempotent 처리**를 추가함(중복 클릭·화면 재진입 시 에러 대신 기존 결과 반환).
3. **`RunningEndDto.Response.defaultHeartRateSource`**, **`RecoveryActionType.UV_CAUTION`**: 명세에는 없지만 화면 요구사항을 충족하기 위해 임의로 추가한 응답 필드.
4. **소유권 오류 코드**: 남의 리소스(세션/가이드/측정기록) 접근 시 `404`가 아니라 **`403 E4030`**으로 통일(리소스 존재 여부 비노출).
5. **`RunningCompleteResponse.reportId`**: 별도 Report 엔티티가 ERD에 없어 `recoveryGuideId`를 재사용.

## 부록 D. 확인이 필요한 부분

- 배포 서버 Base URL 확정 필요 (현재는 로컬 `localhost:8080` 기준)
- `UserGoal.goalType`의 고정 enum 후보값 (현재는 자유 문자열)
- 러닝 준비(`GET /running-sessions/prepare`)에서 `lat`/`lng` 쿼리 파라미터를 아예 누락했을 때의 에러 코드 — 현재 컨트롤러 시그니처상 `MissingServletRequestParameterException`이 발생하는데, `GlobalExceptionHandler`에 전용 핸들러가 없어 `500 E5000`으로 떨어질 가능성이 있습니다. 실제 동작 확인 및 전용 핸들러 추가 검토 필요.
