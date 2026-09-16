// 기록 추가하기(워치 가져오기·직접 입력) 공용 등록 시퀀스. UI 없는 순수 로직.
// 서버 러닝 세션은 "시작→종료" 생명주기지만 시각 필드가 전부 클라이언트 제공값이라
// "생성 → 즉시 종료"로 과거 워크아웃을 소급 등록할 수 있다(새 백엔드 API 불필요).
import {
  startRunning,
  endRunning,
  closeStaleSession,
  selectHeartRateSource,
  uploadWatchHeartRate,
  createRecoveryGuide,
  completeRunning,
  getUvForecast,
} from './api/endpoints.js'
import { localDateTime } from './api/client.js'
import { intensityFromPace, hourBucketAt } from './utils.js'

// 서버가 위치를 필수로 요구해(E4001) 언제나 좌표를 채워 보내야 한다. 못 구했을 때 쓰는
// 최후의 값 — API 명세 예시에 나오는 좌표(서울시청)라 서버가 받아준다는 게 검증돼 있다.
const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.9780 }

function getCurrentPosition(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 60000 },
    )
  })
}

// 순서: 힌트(워치 워크아웃의 GPS 첫 점) → 기기 현재 위치 → 명세 예시 좌표.
async function resolveLocation(hint) {
  if (hint?.lat != null && hint?.lng != null) return { lat: hint.lat, lng: hint.lng }
  return (await getCurrentPosition()) ?? FALLBACK_LOCATION
}

// startedAt이 오늘이면 실제 UV를, 아니면 0을 보낸다. 과거 러닝에 "지금" UV를 채우면
// 회복 가이드가 틀린 근거로 생성되므로(§8-1) 모를 때는 0이 맞다. 조회 실패(E5011 등)도
// 등록 자체를 막으면 안 되므로 0으로 처리한다.
async function resolveUvIndexAtStart(startedAtDate, lat, lng) {
  const isToday = startedAtDate.toDateString() === new Date().toDateString()
  if (!isToday) return 0
  try {
    const { hourly } = await getUvForecast(lat, lng)
    return hourBucketAt(hourly, startedAtDate)?.uv ?? 0
  } catch {
    return 0
  }
}

async function createAndEndSession({ startedAt, endedAt, locationHint, durationSec, distanceKm, intensity, routePath }) {
  const { lat, lng } = await resolveLocation(locationHint)
  const uvIndexAtStart = await resolveUvIndexAtStart(new Date(startedAt), lat, lng)

  let session
  try {
    session = await startRunning(lat, lng, uvIndexAtStart, startedAt)
  } catch (err) {
    if (err.code !== 'E4090') throw err
    // 이전에 종료 못 한 세션이 남아 새 러닝을 막고 있는 경우 — 찾아서 닫고 한 번 더 시도
    await closeStaleSession()
    session = await startRunning(lat, lng, uvIndexAtStart, startedAt)
  }

  const endPayload = { durationSec, distanceKm, intensity, routePath, endedAt }
  try {
    await endRunning(session.runningSessionId, endPayload)
  } catch {
    // 네트워크가 끊겨 실패했을 수 있으니 한 번만 재시도 — 그래도 실패하면 좀비 세션으로
    // 남더라도(다음 시작 시 E4090으로 자동 정리됨) 호출부가 사용자에게 알리게 에러를 던진다.
    await endRunning(session.runningSessionId, endPayload)
  }

  return session.runningSessionId
}

// 2-A: 애플워치 워크아웃 가져오기. 한 번의 사용자 액션으로 전체 시퀀스를 끝까지 진행한다.
export async function importWatchWorkout({ workout }) {
  const sessionId = await createAndEndSession({
    // HealthKit 날짜는 UTC(Z) 문자열로 온다 — 서버는 오프셋 없는 로컬 시각을 기대하므로
    // localDateTime()으로 변환해서 보낸다(그대로 넘기면 시각이 9시간 어긋난다).
    startedAt: localDateTime(new Date(workout.startedAt)),
    endedAt: localDateTime(new Date(workout.endedAt)),
    locationHint: workout.startLocation,
    durationSec: workout.durationSec,
    distanceKm: workout.distanceKm,
    intensity: intensityFromWorkoutPace(workout),
    routePath: workout.routePath,
  })

  // select-source는 흐름 기록용이라 값이 저장되지 않는다 — 실패해도 등록을 막지 않는다.
  selectHeartRateSource(sessionId, 'WATCH').catch(() => {})

  if (workout.avgBpm != null) {
    await uploadWatchHeartRate(sessionId, { avgBpm: workout.avgBpm, maxBpm: workout.maxBpm, hrvMs: null }).catch(() => {})
  }

  await finishImportSession(sessionId)
  return sessionId
}

// utils.js의 intensityFromPace를 그대로 쓴다 — 실시간 러닝(App.jsx)과 같은 지표(전체 평균 페이스)로
// 계산해야 같은 러닝이 경로에 따라 다른 강도로 분류되지 않는다.
function intensityFromWorkoutPace(workout) {
  const secPerKm = workout.distanceKm > 0 ? workout.durationSec / workout.distanceKm : null
  return intensityFromPace(secPerKm)
}

// 2-B: 직접 입력. 생성+종료만 하고 심박수는 이후 별도 스텝(측정 또는 건너뛰기)에서 처리한다.
// locationHint 없이 호출 → resolveLocation이 기기 현재 위치 → 명세 예시 좌표로 폴백한다.
export async function createManualSession({ startedAt, endedAt, durationSec, distanceKm, intensity }) {
  return createAndEndSession({ startedAt, endedAt, durationSec, distanceKm, intensity })
}

export async function selectRppgForSession(sessionId) {
  return selectHeartRateSource(sessionId, 'RPPG').catch(() => {})
}

// 회복 가이드 생성 + 세션 완료. 둘 다 idempotent이며, 가이드 생성이 실패해도(§8-2: 심박수 없는
// 세션에 대한 서버 동작이 명세에 없음) 등록 자체는 성공으로 처리하고 기록만 남긴다.
export async function finishImportSession(sessionId) {
  await createRecoveryGuide(sessionId).catch(() => {})
  await completeRunning(sessionId).catch(() => {})
}
