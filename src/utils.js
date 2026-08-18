export function fmtElapsed(sec) {
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
}

export function fmtPace(sec, km) {
  if (km <= 0) return "--'--\""
  const spk = sec / km
  return Math.floor(spk / 60) + "'" + String(Math.round(spk % 60)).padStart(2, '0') + '"'
}

export function uvBand(uv) {
  if (uv <= 2) return '낮음'
  if (uv <= 5) return '보통'
  if (uv <= 7) return '높음'
  return '매우 높음'
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

// 오늘 날짜를 "8월 15일 토요일" 형식으로
export function fmtTodayLabel(d = new Date()) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}

// 서버가 주는 GPS 좌표 배열([{lat,lng}])을 RunMap이 그리는 290x200 뷰박스의
// 폴리라인 path(d)로 정규화한다. 점이 2개 미만이면 그릴 선이 없으므로 null.
export function routeToSvgPath(routePath) {
  if (!Array.isArray(routePath) || routePath.length < 2) return null
  const lats = routePath.map((p) => p.lat)
  const lngs = routePath.map((p) => p.lng)
  const latMin = Math.min(...lats), latMax = Math.max(...lats)
  const lngMin = Math.min(...lngs), lngMax = Math.max(...lngs)
  const latRange = latMax - latMin || 0.0005
  const lngRange = lngMax - lngMin || 0.0005
  const PAD = 34
  const W = 290 - PAD * 2
  const H = 200 - PAD * 2
  const pts = routePath.map((p) => [
    Math.round((PAD + ((p.lng - lngMin) / lngRange) * W) * 10) / 10,
    // 위도가 클수록 화면 위쪽(=y 작음)이 되도록 뒤집는다
    Math.round((PAD + (1 - (p.lat - latMin) / latRange) * H) * 10) / 10,
  ])
  return { d: 'M' + pts.map((xy) => xy.join(',')).join(' L'), start: pts[0] }
}
