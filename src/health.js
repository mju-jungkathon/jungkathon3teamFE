import { Capacitor } from '@capacitor/core'
import { haversineKm } from './utils.js'

// 웹(브라우저·Vercel 배포)에서는 HealthKit 접근이 원천적으로 불가하므로 목업을 유지한다.
// 네이티브 iOS 빌드에서만 실제 건강 데이터를 읽는다.
const WEB_MOCK = { avgBpm: 152, maxBpm: 168, hrvMs: 42, mocked: true }

// 최근 24시간 내 러닝 기록의 심박수를 가져온다.
// 반환: { avgBpm, maxBpm, hrvMs, mocked } | null(기록 없음)
export async function readLatestWorkoutHeartRate() {
  if (!Capacitor.isNativePlatform()) return WEB_MOCK

  // 웹 번들에 네이티브 플러그인이 섞이지 않도록 동적 임포트한다.
  const { Health } = await import('capacitor-health')

  const { available } = await Health.isHealthAvailable()
  if (!available) return WEB_MOCK

  // 권한 다이얼로그는 OS가 띄운다. 거부해도 예외는 안 나고 결과가 비어서 온다.
  await Health.requestHealthPermissions({
    permissions: ['READ_WORKOUTS', 'READ_HEART_RATE'],
  })

  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)

  const { workouts } = await Health.queryWorkouts({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    includeHeartRate: true,
    includeRoute: false,
    includeSteps: false,
  })

  const withHr = (workouts ?? []).filter((w) => w.heartRate?.length)
  if (!withHr.length) return null

  const latest = withHr.sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  )[0]

  const bpms = latest.heartRate.map((s) => s.bpm).filter(Number.isFinite)
  if (!bpms.length) return null

  return {
    avgBpm: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
    maxBpm: Math.max(...bpms),
    // 이 플러그인은 HRV를 제공하지 않는다. 서버 스펙상 선택값이라 null로 보낸다.
    hrvMs: null,
    mocked: false,
  }
}

// routePath 점 개수 상한(서버 §3.5, 10,000점)을 넉넉히 피하려고 5초/10m 중 하나라도
// 지나야 다음 점을 채택한다. HealthKit route는 촘촘해서 그대로 보내면 서버가 400을 낸다.
function throttleRoute(points) {
  const out = []
  let last = null
  for (const p of points) {
    if (!last || p.t - last.t >= 5 || haversineKm(last.lat, last.lng, p.lat, p.lng) * 1000 >= 10) {
      out.push(p)
      last = p
    }
  }
  return out
}

// capacitor-health(HealthKit) Workout → 서버 러닝 세션 필드로 변환.
// 단위는 플러그인 iOS 네이티브 소스로 확인함(node_modules/capacitor-health/ios/.../HealthPlugin.swift):
// duration은 초, distance는 .meter() 명시 변환이라 미터 — /1000으로 km 변환.
function normalizeWorkout(w) {
  const bpms = (w.heartRate ?? []).map((s) => s.bpm).filter(Number.isFinite)
  const startMs = new Date(w.startDate).getTime()

  const routePath = throttleRoute(
    (w.route ?? [])
      .map((r) => ({ lat: r.lat, lng: r.lng, t: Math.round((new Date(r.timestamp).getTime() - startMs) / 1000) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.t >= 0),
  )

  return {
    workoutId: w.id,
    startedAt: w.startDate,
    endedAt: w.endDate,
    durationSec: Math.round(w.duration),
    distanceKm: (w.distance ?? 0) / 1000,
    avgBpm: bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : null,
    maxBpm: bpms.length ? Math.max(...bpms) : null,
    routePath: routePath.length ? routePath : undefined,
    startLocation: routePath.length ? { lat: routePath[0].lat, lng: routePath[0].lng } : null,
  }
}

// 최근 N일 내 "러닝" 워크아웃 목록. 기록 추가하기(워치 가져오기)에서 쓴다.
// 웹이거나 HealthKit 미사용/권한 거부 시 빈 배열 — 호출부가 "iOS 앱에서만 가능해요" 등으로 안내한다.
export async function queryRecentRunningWorkouts(days = 7) {
  if (!Capacitor.isNativePlatform()) return []

  const { Health } = await import('capacitor-health')

  const { available } = await Health.isHealthAvailable()
  if (!available) return []

  await Health.requestHealthPermissions({
    permissions: ['READ_WORKOUTS', 'READ_HEART_RATE', 'READ_ROUTE'],
  })

  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

  const { workouts } = await Health.queryWorkouts({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    includeHeartRate: true,
    includeRoute: true,
    includeSteps: false,
  })

  return (workouts ?? [])
    .filter((w) => w.workoutType === 'running')
    .map(normalizeWorkout)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}