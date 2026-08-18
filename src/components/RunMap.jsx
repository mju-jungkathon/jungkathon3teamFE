import { useEffect, useRef, useState } from 'react'

// Illustrative closed-loop street shape (no real GPS/map API wired up yet —
// swap `ROUTE_D` for real coordinates once a maps provider is connected).
const ROUTE_D =
  'M62,150 C40,112 42,72 82,50 C122,28 182,28 222,54 ' +
  'C262,79 262,122 230,146 C200,169 150,176 110,166 C86,159 72,156 62,150 Z'

// How long (seconds) it takes to fully trace the loop once, purely for the
// draw-in animation — the timer/pace numbers above the map are the real ones.
const LOOP_SECONDS = 50

export default function RunMap({ elapsedSeconds = 0, distanceLabel, paceLabel }) {
  const pathRef = useRef(null)
  const [pathLen, setPathLen] = useState(0)
  const [dot, setDot] = useState({ x: 62, y: 150 })

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
  }, [])

  useEffect(() => {
    if (!pathRef.current || !pathLen) return
    const drawnPct = Math.min(100, (elapsedSeconds / LOOP_SECONDS) * 100)
    const loopPct = (elapsedSeconds % LOOP_SECONDS) / LOOP_SECONDS * 100
    const dotPct = elapsedSeconds <= LOOP_SECONDS ? drawnPct : loopPct
    const pt = pathRef.current.getPointAtLength((dotPct / 100) * pathLen)
    setDot({ x: pt.x, y: pt.y })
  }, [elapsedSeconds, pathLen])

  const drawnPct = Math.min(100, (elapsedSeconds / LOOP_SECONDS) * 100)
  const dashOffset = pathLen - (drawnPct / 100) * pathLen

  return (
    <div className="map-card">
      <div className="map-stats-bar">
        <div className="map-chip">거리 <b>{distanceLabel}</b></div>
        <div className="map-chip">페이스 <b>{paceLabel}</b></div>
      </div>

      <svg className="map-svg" viewBox="0 0 290 210" xmlns="http://www.w3.org/2000/svg">
        {/* faint street grid */}
        <g stroke="var(--hairline)" strokeWidth="1">
          <line x1="0" y1="45" x2="290" y2="45" />
          <line x1="0" y1="100" x2="290" y2="100" />
          <line x1="0" y1="160" x2="290" y2="160" />
          <line x1="55" y1="0" x2="55" y2="210" />
          <line x1="150" y1="0" x2="150" y2="210" />
          <line x1="235" y1="0" x2="235" y2="210" />
        </g>
        {/* park block */}
        <rect x="118" y="66" width="66" height="46" rx="10" fill="var(--surface-cream-strong)" />

        {/* planned route (faint) */}
        <path d={ROUTE_D} fill="none" stroke="var(--primary-disabled)" strokeWidth="4" strokeLinecap="round" />

        {/* covered route (solid, animates in) */}
        <path
          ref={pathRef}
          d={ROUTE_D}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={pathLen || 1}
          strokeDashoffset={pathLen ? dashOffset : 0}
          style={{ transition: 'stroke-dashoffset .9s linear' }}
        />

        {/* start pin */}
        <circle cx="62" cy="150" r="4" fill="var(--canvas)" stroke="var(--ink)" strokeWidth="1.5" />

        {/* current position */}
        <circle className="map-dot-pulse" cx={dot.x} cy={dot.y} r="7" />
        <circle className="map-dot" cx={dot.x} cy={dot.y} r="6" />
      </svg>

      <div className="map-caption">현재 위치 · 서울 성동구 인근 러닝 루트</div>
    </div>
  )
}