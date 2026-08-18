import { useEffect, useRef } from 'react'
import { PATH_A } from '../data.js'
import { loadKakao } from '../kakao.js'

// 실제 GPS/지도 제공자는 아직 연동 전 — 경로는 예시 도형이다.
// `path`를 실제 좌표로 바꾸면 그대로 동작한다.
const ROUTE_LEN = 610

// 러닝 진행 중(live)엔 현재 위치를 따라가고, 종료된 러닝(fit)엔 경로 전체가 보이게 맞춘다.
function LiveMap({ points, fit = false }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const lineRef = useRef(null)
  const startMarkerRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!points.length) return
    let cancelled = false
    loadKakao().then((kakao) => {
      if (cancelled || !elRef.current) return
      const path = points.map((p) => new kakao.maps.LatLng(p.lat, p.lng))
      const last = path[path.length - 1]
      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(elRef.current, { center: last, level: 4 })
        lineRef.current = new kakao.maps.Polyline({
          map: mapRef.current, strokeWeight: 4, strokeColor: '#171717', strokeOpacity: 0.9,
        })
        markerRef.current = new kakao.maps.Marker({ map: mapRef.current, position: last })
      }
      lineRef.current.setPath(path)
      markerRef.current.setPosition(last)

      if (fit && path.length > 1) {
        if (!startMarkerRef.current) {
          startMarkerRef.current = new kakao.maps.Marker({ map: mapRef.current, position: path[0] })
        } else {
          startMarkerRef.current.setPosition(path[0])
        }
        mapRef.current.setBounds(path.reduce((b, ll) => (b.extend(ll), b), new kakao.maps.LatLngBounds()))
      } else {
        mapRef.current.panTo(last)
      }
    })
    return () => { cancelled = true }
  }, [points, fit])

  return <div ref={elRef} style={{ width: '100%', aspectRatio: '290 / 200', background: 'var(--soft-cloud)' }} />
}

export default function RunMap({ path = PATH_A, caption, offset, moving = false, start, points, fit = false }) {
  const live = Array.isArray(points)

  if (live) {
    return (
      <div className="map soft">
        <LiveMap points={points} fit={fit} />
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

        {path ? (
          offset == null ? (
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
          )
        ) : (
          <text x="145" y="104" textAnchor="middle" fontSize="12" fill="var(--mute)">경로 정보 없음</text>
        )}

        {moving ? (
          <circle r="6" fill="var(--ink)" stroke="var(--canvas)" strokeWidth="3">
            <animateMotion dur="50s" repeatCount="indefinite" rotate="auto">
              <mpath href="#agRoute" />
            </animateMotion>
          </circle>
        ) : start && path ? (
          <circle cx={start[0]} cy={start[1]} r="5" fill="var(--canvas)" stroke="var(--ink)" strokeWidth="3" />
        ) : null}
      </svg>
      {caption && <div className="cap">{caption}</div>}
    </div>
  )
}

export { ROUTE_LEN }
