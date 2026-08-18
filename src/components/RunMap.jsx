import { useEffect, useRef } from 'react'
import { PATH_A } from '../data.js'
import { loadKakao } from '../kakao.js'

// 실제 GPS/지도 제공자는 아직 연동 전 — 경로는 예시 도형이다.
// `path`를 실제 좌표로 바꾸면 그대로 동작한다.
const ROUTE_LEN = 610

// 러닝 진행 중(live) 카카오맵: 현재 위치 마커 + 지나온 경로 폴리라인.
function LiveMap({ points }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const lineRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!points.length) return
    let cancelled = false
    loadKakao().then((kakao) => {
      if (cancelled || !elRef.current) return
      const last = points[points.length - 1]
      const center = new kakao.maps.LatLng(last.lat, last.lng)
      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(elRef.current, { center, level: 4 })
        lineRef.current = new kakao.maps.Polyline({
          map: mapRef.current, strokeWeight: 4, strokeColor: '#171717', strokeOpacity: 0.9,
        })
        markerRef.current = new kakao.maps.Marker({ map: mapRef.current, position: center })
      }
      lineRef.current.setPath(points.map((p) => new kakao.maps.LatLng(p.lat, p.lng)))
      markerRef.current.setPosition(center)
      mapRef.current.panTo(center)
    })
    return () => { cancelled = true }
  }, [points])

  return <div ref={elRef} style={{ width: '100%', aspectRatio: '290 / 200', background: 'var(--soft-cloud)' }} />
}

export default function RunMap({ path = PATH_A, caption, offset, moving = false, start, points }) {
  const live = Array.isArray(points)

  if (live) {
    return (
      <div className="map soft">
        <LiveMap points={points} />
        {caption && <div className="cap">{points.length === 0 ? '위치 수집 중…' : caption}</div>}
      </div>
    )
  }

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

        {offset == null ? (
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

        {moving ? (
          <circle r="6" fill="var(--ink)" stroke="var(--canvas)" strokeWidth="3">
            <animateMotion dur="50s" repeatCount="indefinite" rotate="auto">
              <mpath href="#agRoute" />
            </animateMotion>
          </circle>
        ) : start ? (
          <circle cx={start[0]} cy={start[1]} r="5" fill="var(--canvas)" stroke="var(--ink)" strokeWidth="3" />
        ) : null}
      </svg>
      {caption && <div className="cap">{caption}</div>}
    </div>
  )
}

export { ROUTE_LEN }
