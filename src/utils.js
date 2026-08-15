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
