// docs/API.md 25개 엔드포인트 전부. 응답은 껍데기 벗긴 data가 그대로 나온다.
import { api, request, setTokens, localDateTime } from './client.js'

// --- 1. 인증 ---
// 가입 응답에도 accessToken이 함께 온다 — 온보딩(목표 설정)에서 바로 쓸 수 있도록 여기서 저장한다.
export async function signup(email, password, nickname, agree = {}) {
  const d = await request('POST', '/auth/signup', {
    body: {
      email,
      password,
      nickname,
      agreeTerms: !!agree.terms,
      agreePrivacy: !!agree.privacy,
      agreeMarketing: !!agree.marketing,
    },
    auth: false,
  })
  setTokens({ accessToken: d.accessToken, refreshToken: d.refreshToken, expiresIn: d.expiresIn })
  return d
}

export async function login(email, password) {
  const t = await request('POST', '/auth/login', { body: { email, password }, auth: false })
  setTokens(t)
  return t
}

export async function logout() {
  try {
    await api.post('/auth/logout') // 인증 필요 — 토큰 지우기 전에 호출
  } finally {
    setTokens(null)
  }
}

// --- 2. 홈 ---
export const getHome = () => api.get('/home')

// --- 3. 러닝 세션 ---
export const getPrepare = (lat, lng) => api.get('/running-sessions/prepare', { lat, lng })
export const startStretching = (type = 'PRE_RUN') => api.post('/stretching-sessions', { type })

export const startRunning = (lat, lng, uvIndexAtStart) =>
  api.post('/running-sessions', {
    startedAt: localDateTime(),
    location: { lat, lng },
    uvIndexAtStart,
  })

// 좀비 IN_PROGRESS 세션(E4090) 복구용 — 목록에서 진행 중 세션을 찾아 강제 종료할 때 쓴다.
export const listRunningSessions = (range = '30d') => api.get('/running-sessions', { range })

// distanceKm/intensity를 실어 보내면 서버 스냅샷도 같이 갱신된다.
export const getLive = (sessionId, distanceKm, intensity) =>
  api.get(`/running-sessions/${sessionId}/live`, { distanceKm, intensity })

// idempotent — 중복 호출해도 안전. routePath(선택, 최대 10,000점)는 History 상세 지도용.
export const endRunning = (sessionId, { durationSec, distanceKm, intensity, routePath }) =>
  api.post(`/running-sessions/${sessionId}/end`, {
    endedAt: localDateTime(),
    durationSec,
    distanceKm,
    intensity,
    ...(routePath?.length ? { routePath } : {}),
  })

// --- 4. 심박수 ---
// 선택값은 저장되지 않는다. 응답의 nextStep만 화면 분기에 쓸 것.
export const selectHeartRateSource = (sessionId, heartRateSource) =>
  api.post(`/running-sessions/${sessionId}/heart-rate/select-source`, { heartRateSource })

// 웹에서는 HealthKit 접근 불가 — 워치 화면은 목업 유지(CLAUDE.md 참고).
export const uploadWatchHeartRate = (runningSessionId, { avgBpm, maxBpm, hrvMs }) =>
  api.post('/integrations/apple-health/heart-rate', {
    runningSessionId,
    avgBpm,
    maxBpm,
    hrvMs,
    syncedAt: localDateTime(),
  })
export const linkAppleHealth = (linked) => api.post('/integrations/apple-health/link', { linked })

export const getRppgGuide = () => api.get('/heart-rate-measurements/rppg/guide')
export const startRppg = (runningSessionId) =>
  api.post('/heart-rate-measurements/rppg/start', { runningSessionId })

// rppgSessionId는 1회용(재제출 시 404). signalQuality:'POOR'도 201이며 syncStatus:'FAILED'로 온다.
export const submitRppg = (rppgSessionId, { avgBpm, maxBpm, hrvMs, signalQuality }) =>
  api.post(`/heart-rate-measurements/rppg/${rppgSessionId}/result`, {
    avgBpm,
    maxBpm,
    hrvMs,
    measuredAt: localDateTime(),
    signalQuality,
  })

export const getMeasurements = (range = '30d') => api.get('/heart-rate-measurements', { range })
export const retryMeasurement = (measurementId) =>
  api.post(`/heart-rate-measurements/${measurementId}/retry`)

// --- 4-1. 러닝 기록 조회 (화면 8, 기록 화면) ---
// 목록 응답에는 경로(GPS)가 빠져 있다 — 지도는 상세 조회에서만 채워진다.
export const getRunningSessions = (range = '90d') => api.get('/running-sessions', { range })
export const getRunningSessionDetail = (sessionId) => api.get(`/running-sessions/${sessionId}`)

// --- 5. 회복 가이드 ---
// idempotent. complete 전에 반드시 이걸 먼저 호출해야 한다(안 하면 404).
export const createRecoveryGuide = (sessionId) =>
  api.post(`/running-sessions/${sessionId}/recovery-guide`)
export const startCooldownTimer = (guideId) =>
  api.post(`/recovery-guides/${guideId}/cooldown-timer/start`)
export const completeRunning = (sessionId) => api.post(`/running-sessions/${sessionId}/complete`)

// 항상 200 — 추천 불가 시에도 recommendedRanges:[] + reason 메시지로 degrade됨(에러 아님).
export const getNextRunSuggestion = (guideId) =>
  api.get(`/recovery-guides/${guideId}/next-run-suggestion`)

// --- 6. 프로필 ---
export const getProfile = () => api.get('/users/me/profile')
export const updateGoal = (goal) => api.patch('/users/me/goal', goal)
export const getIntegrations = () => api.get('/users/me/integrations')
// 서버 값은 "제어"가 아니라 "표시"용 — 브라우저에서 실제 권한을 확인한 결과를 여기로 동기화한다.
export const updateIntegrations = (integrations) => api.patch('/users/me/integrations', integrations)
// 되돌릴 수 없음 — 계정과 러닝 세션·측정·회복가이드가 전부 삭제된다(DB ON DELETE CASCADE).
export const withdrawAccount = (password) => api.delete('/users/me', { password })
export const updateNotifications = (notifications) =>
  api.patch('/users/me/notifications', notifications)

// --- 7. 날씨 (홈 화면 시간대별 UV 그래프) ---
export const getUvForecast = (lat, lng) => api.get('/weather/uv-forecast', { lat, lng })
