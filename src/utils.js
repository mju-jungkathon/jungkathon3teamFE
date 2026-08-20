export function fmtElapsed(sec) {
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
}

export function fmtPace(sec, km) {
  if (km <= 0) return "--'--\""
  const spk = sec / km
  return Math.floor(spk / 60) + "'" + String(Math.round(spk % 60)).padStart(2, '0') + '"'
}

// 두 좌표 사이 거리(km). GPS 트래킹 중 거리 누적용.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ponytail: 페이스 임계값은 대략치(러닝 강도 산정 기준이 API 명세에 없음) — 필요시 조정.
export function intensityFromPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0) return 'MODERATE'
  if (secPerKm <= 330) return 'HIGH'
  if (secPerKm <= 420) return 'MODERATE'
  return 'LOW'
}

export function uvBand(uv) {
  if (uv <= 2) return '낮음'
  if (uv <= 5) return '보통'
  if (uv <= 7) return '높음'
  return '매우 높음'
}

// /weather/uv-forecast의 2시간 단위 hourly 배열에서 "지금"에 해당하는 버킷을 찾는다
export function currentHourBucket(hourly) {
  if (!hourly?.length) return null
  const h = new Date().getHours()
  const key = String(Math.floor(h / 2) * 2).padStart(2, '0')
  return hourly.find((x) => x.hour === key) || hourly[hourly.length - 1]
}

// 달력 그리드: 1일 요일만큼 빈칸(null)을 앞에 채우고 1..말일을 잇는다
export function monthGrid(year, month) {
  const lead = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
}

// ISO 문자열에서 "HH:MM"만 추출
export function fmtClock(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

// 초를 "24분 12초" 형식으로
export function fmtDurationKor(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
}

// E4090 충돌 정리로 자동 종료된 좀비 세션(거리 0·미완료)인지 — 실제 러닝 기록이 아니다.
export function isZombieSession(r) {
  return r.distanceKm === 0 && r.status !== 'COMPLETED'
}

// 이번 주부터 거슬러 몇 주 연속으로 뛰었는지(월요일 시작 주 기준).
export function weeklyStreak(sessions) {
  if (!sessions?.length) return 0
  const weekStart = (iso) => {
    const d = new Date(iso)
    const mondayOffset = (d.getDay() + 6) % 7
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - mondayOffset)
    return d.getTime()
  }
  const weeksWithRun = new Set(sessions.map((s) => weekStart(s.startedAt)))
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  let streak = 0
  let cursor = weekStart(new Date())
  while (weeksWithRun.has(cursor)) {
    streak++
    cursor -= WEEK_MS
  }
  return streak
}

// 오늘 날짜를 "8월 15일 토요일" 형식으로
export function fmtTodayLabel(d = new Date()) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}

// 같은 날짜의 구간들을 날짜 접두어 하나로 묶는다 — "8/21(금) 0시~6시, 12시~14시" (오늘이면 접두어 생략)
function fmtRangesLabel(active, now) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const groups = []
  for (const r of active) {
    const start = new Date(r.startTime)
    const dateKey = start.toDateString()
    const hour = `${start.getHours()}시~${new Date(r.endTime).getHours()}시`
    const last = groups[groups.length - 1]
    if (last?.dateKey === dateKey) last.hours.push(hour)
    else groups.push({ dateKey, date: start, isToday: dateKey === now.toDateString(), hours: [hour] })
  }
  return groups
    .map((g) => (g.isToday ? g.hours.join(', ') : `${g.date.getMonth() + 1}/${g.date.getDate()}(${days[g.date.getDay()]}) ${g.hours.join(', ')}`))
    .join(', ')
}

// next-run-suggestion 응답을 화면에 표시할 { text, tone, caption } 한 줄로 변환.
// recommendedRanges 중 아직 안 지난 구간만 남겨서, 그 중 첫 구간이 오늘이면 안내 문구로,
// 전부 지났으면 새 추천을 받으라는 문구로 바뀐다.
export function fmtNextRunLine(suggestion) {
  if (!suggestion) return null
  const ranges = suggestion.recommendedRanges ?? []
  const now = new Date()
  const active = ranges.filter((r) => new Date(r.endTime) > now)

  if (!active.length) {
    return ranges.length
      ? { text: '다음 러닝 후 새 추천을 받아보세요', tone: 'mute', caption: null }
      : { text: suggestion.reason, tone: 'mute', caption: null }
  }

  const label = fmtRangesLabel(active, now)
  const startsToday = new Date(active[0].startTime).toDateString() === now.toDateString()
  return startsToday
    ? { text: '오늘 러닝을 추천해요!', tone: 'ok', caption: `${label} · ${suggestion.reason}` }
    : { text: `${label}가 좋아요`, tone: 'ok', caption: suggestion.reason }
}

const NEXT_RUN_KEY = 'aftergrow.nextRunSuggestion'

// Home 화면은 recoveryGuideId가 없어 API를 직접 못 부른다 — 회복 가이드 화면에서 받은 값을 여기 저장해두고 읽는다.
export function saveNextRunSuggestion(suggestion) {
  try { globalThis.localStorage?.setItem(NEXT_RUN_KEY, JSON.stringify(suggestion)) } catch {}
}

export function loadNextRunSuggestion() {
  try { return JSON.parse(globalThis.localStorage?.getItem(NEXT_RUN_KEY) || 'null') } catch { return null }
}

