import { PATH_A } from '../data.js'

// 실제 GPS/지도 제공자는 아직 연동 전 — 경로는 예시 도형이다.
// `path`를 실제 좌표로 바꾸면 그대로 동작한다.
const ROUTE_LEN = 610

// 실제 lat/lng 배열을 290x200 viewBox에 맞게 정규화(북쪽이 위로 오도록 위도축 반전).
function projectPoints(points, width = 290, height = 200, pad = 20) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const latSpan = Math.max(...lats) - Math.min(...lats) || 0.0005 // 거의 안 움직였을 때 0 나눗셈 방지
  const lngSpan = Math.max(...lngs) - Math.min(...lngs) || 0.0005
  const minLat = Math.min(...lats)
  const minLng = Math.min(...lngs)
  const w = width - pad * 2
  const h = height - pad * 2
  return points.map((p) => ({
    x: pad + ((p.lng - minLng) / lngSpan) * w,
    y: pad + h - ((p.lat - minLat) / latSpan) * h,
  }))
}

export default function RunMap({ path = PATH_A, caption, offset, moving = false, start, points }) {
  const live = Array.isArray(points)
  const pts = live && points.length >= 2 ? projectPoints(points) : null
  const liveD = pts ? 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L') : null
  const last = pts?.[pts.length - 1]

  return (
    <div className="map soft">
      <svg viewBox="0 0 290 200" xmlns="http://www.w3.org/2000/svg">
        <g stroke="var(--hairline)" strokeWidth="1">
          <line x1="0" y1="50" x2="290" y2="50" />
          <line x1="0" y1="105" x2="290" y2="105" />
          <line x1="0" y1="158" x2="290" y2="158" />
          <line x1="70" y1="0" x2="70" y2="200" />
          <line x1="160" y1="0" x2="160" y2="200" />
          <line x1="240" y1="0" x2="240" y2="200" />
        </g>

        {live ? (
          liveD && (
            <>
              <path d={liveD} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={last.x} cy={last.y} r="6" fill="var(--ink)" stroke="var(--canvas)" strokeWidth="3" />
            </>
          )
        ) : offset == null ? (
          <path id="agRoute" d={path} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <>
            <path id="agRoute" d={path} fill="none" stroke="var(--hairline)" strokeWidth="4" strokeLinecap="round" />
            <path
              d={path} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={ROUTE_LEN} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset .9s linear' }}
            />
          </>
        )}

        {!live && (moving ? (
          <circle r="6" fill="var(--ink)" stroke="var(--canvas)" strokeWidth="3">
            <animateMotion dur="50s" repeatCount="indefinite" rotate="auto">
              <mpath href="#agRoute" />
            </animateMotion>
          </circle>
        ) : start ? (
          <circle cx={start[0]} cy={start[1]} r="5" fill="var(--canvas)" stroke="var(--ink)" strokeWidth="3" />
        ) : null)}
      </svg>
      {caption && <div className="cap">{live && !liveD ? '위치 수집 중…' : caption}</div>}
    </div>
  )
}

export { ROUTE_LEN }
