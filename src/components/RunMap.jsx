import { PATH_A } from '../data.js'

// 실제 GPS/지도 제공자는 아직 연동 전 — 경로는 예시 도형이다.
// `path`를 실제 좌표로 바꾸면 그대로 동작한다.
const ROUTE_LEN = 610

export default function RunMap({ path = PATH_A, caption, offset, moving = false, start }) {
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
