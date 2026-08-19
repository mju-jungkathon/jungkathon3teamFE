import RingGauge from './RingGauge.jsx'
import { selectHeartRateSource, uploadWatchHeartRate } from '../api/endpoints.js'

// 웹은 HealthKit에 접근할 수 없어 워치 데이터는 목업으로 유지한다(CLAUDE.md 참고).
// 서버에는 안 올리지만, 화면(Solution 등)에서 계속 같은 값을 보여주도록 run.scanResult에 심어둔다.
const WATCH_MOCK = { avgBpm: 152, maxBpm: 168, hrvMs: 42 }

export default function Vitals({ run, setRun }) {
  // nextStep은 WATCH→FETCH_APPLE_HEALTH, RPPG→RPPG_GUIDE로 고정이라 화면 분기는 그대로 로컬에서 하고,
  // 이 호출은 서버 쪽 흐름 기록용이라 실패해도 로컬 분기를 막지 않는다(선택값 자체는 저장 안 됨).
  const pick = (source) => () => {
    setRun((r) => ({ ...r, source, scanResult: source === 'watch' ? WATCH_MOCK : null }))
    selectHeartRateSource(run.sessionId, source.toUpperCase()).catch(() => {})
    // 기록 화면에서도 값이 남아있도록 목업을 실제 측정 기록으로 서버에 남긴다(워치 선택 시에만).
    if (source === 'watch') uploadWatchHeartRate(run.sessionId, WATCH_MOCK).catch(() => {})
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div className="display" style={{ fontSize: 44, lineHeight: .95 }}>심박수를<br />확인할까요</div>
      <div className="body" style={{ marginTop: 10 }}>
        {run.distanceKm.toFixed(1)}km 러닝을 마쳤어요. 워치가 있다면 워치 데이터를, 없다면 카메라로 측정해요
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
            <RingGauge size={160} outerPct={0.55} innerPct={0.75} value={WATCH_MOCK.avgBpm} label={`${WATCH_MOCK.avgBpm} BPM`} />
            <div className="cap" style={{ color: 'var(--charcoal)' }}>BPM · 최고 {WATCH_MOCK.maxBpm}</div>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            심박변이도(HRV)<span className="v">{WATCH_MOCK.hrvMs}ms</span>
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
