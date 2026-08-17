import RunMap from './RunMap.jsx'
import { fmtElapsed, fmtPace } from '../utils.js'

const INTENSITY_LABEL = { LOW: '저강도', MODERATE: '중강도', HIGH: '고강도' }

export default function Tracking({ run }) {
  const km = run.distanceKm

  return (
    <div>
      <div style={{ padding: '24px 20px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="cap-sm">경과 시간</div>
          <div className="display" style={{ fontSize: 76, marginTop: 6 }}>{fmtElapsed(run.elapsed)}</div>
        </div>
        <div style={{ paddingBottom: 10 }}>
          <span className="badge inverse">{INTENSITY_LABEL[run.intensity]}</span>
        </div>
      </div>

      <RunMap points={run.route} caption={run.prepare?.locationLabel ?? '위치 확인 중…'} />

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
        UV 지수
        <span style={{ font: 'var(--type-body-strong)' }}>
          {run.prepare ? `${run.prepare.uvIndex} · ${run.prepare.uvLevel}` : '-'}
        </span>
      </div>
    </div>
  )
}
