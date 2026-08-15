import RunMap, { ROUTE_LEN } from './RunMap.jsx'
import { AVG_SPEED_MPS, PATH_A } from '../data.js'
import { fmtElapsed, fmtPace } from '../utils.js'

// 루프 한 바퀴를 그리는 데 걸리는 시간(초) — 경로 드로잉 애니메이션 전용.
const LOOP_SECONDS = 50

export default function Tracking({ run }) {
  const km = (run.elapsed * AVG_SPEED_MPS) / 1000
  const offset = Math.max(0, ROUTE_LEN - Math.min(1, run.elapsed / LOOP_SECONDS) * ROUTE_LEN)

  return (
    <div>
      <div style={{ padding: '24px 20px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="cap-sm">경과 시간</div>
          <div className="display" style={{ fontSize: 76, marginTop: 6 }}>{fmtElapsed(run.elapsed)}</div>
        </div>
        <div style={{ paddingBottom: 10 }}>
          <span className="badge inverse">중강도</span>
        </div>
      </div>

      <RunMap path={PATH_A} offset={offset} moving caption="서울 성동구 인근 러닝 루트" />

      <div className="stat-grid c2 section">
        <div className="stat bordered-b" style={{ padding: '20px 0' }}>
          <div className="k">거리</div>
          <div className="n" style={{ fontSize: 52 }}>{km.toFixed(2)}<span className="u">km</span></div>
        </div>
        <div className="stat bordered-b" style={{ padding: '20px 0' }}>
          <div className="k">페이스</div>
          <div className="n" style={{ fontSize: 52 }}>{fmtPace(run.elapsed, km)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', font: 'var(--type-body-md)' }}>
        UV 지수<span style={{ font: 'var(--type-body-strong)' }}>6 · 보통</span>
      </div>
    </div>
  )
}
