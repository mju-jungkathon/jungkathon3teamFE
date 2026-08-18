import RingGauge from './RingGauge.jsx'
import { selectHeartRateSource } from '../api/endpoints.js'

export default function Vitals({ run, setRun }) {
  // nextStep은 WATCH→FETCH_APPLE_HEALTH, RPPG→RPPG_GUIDE로 고정이라 화면 분기는 그대로 로컬에서 하고,
  // 이 호출은 서버 쪽 흐름 기록용이라 실패해도 로컬 분기를 막지 않는다(선택값 자체는 저장 안 됨).
  const pick = (source) => () => {
    setRun((r) => ({ ...r, source }))
    selectHeartRateSource(run.sessionId, source.toUpperCase()).catch(() => {})
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div className="display" style={{ fontSize: 44, lineHeight: .95 }}>심박수를<br />확인할까요</div>
      <div className="body" style={{ marginTop: 10 }}>
        4.8km 러닝을 마쳤어요. 워치가 있다면 워치 데이터를, 없다면 카메라로 측정해요
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
        <button className={`pick ${run.source === 'watch' ? 'on' : ''}`} onClick={pick('watch')}>
          <span className="pt">워치 있어요</span>
          <span className="pd">연동된 워치 기록 사용</span>
        </button>
        <button className={`pick ${run.source === 'rppg' ? 'on' : ''}`} onClick={pick('rppg')}>
          <span className="pt">워치 없어요</span>
          <span className="pd">카메라로 12초 측정</span>
        </button>
      </div>

      {run.source === 'watch' && (
        <div style={{ marginTop: 22 }}>
          <div className="soft" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="cap-sm">워치 데이터 · 평균 심박수</div>
            <RingGauge size={160} outerPct={0.55} innerPct={0.75} value={152} label="152 BPM" />
            <div className="cap" style={{ color: 'var(--charcoal)' }}>BPM · 최고 168</div>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            심박변이도(HRV)<span className="v">42ms</span>
          </div>
          <div className="row" style={{ borderTop: 'none' }}>UV 노출<span className="v">지수 6 · 38분</span></div>
        </div>
      )}

      {run.source === 'rppg' && (
        <div className="soft" style={{ padding: 18, marginTop: 22 }}>
          <div style={{ font: 'var(--type-body-strong)' }}>손가락으로 측정할게요</div>
          <div className="body" style={{ marginTop: 6 }}>후면 카메라와 플래시에 손가락을 밀착해 약 12초간 측정해요</div>
        </div>
      )}
    </div>
  )
}
