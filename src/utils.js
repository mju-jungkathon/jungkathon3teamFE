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

// 달력 그리드: 1일 요일만큼 빈칸(null)을 앞에 채우고 1..말일을 잇는다
export function monthGrid(year, month) {
  const lead = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
}
