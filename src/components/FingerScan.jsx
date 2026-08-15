import RingGauge from './RingGauge.jsx'

const SCAN_SECONDS = 12

export default function FingerScan({ run }) {
  const measuring = run.scanStage === 'measuring'
  const done = run.scanStage === 'done'

  return (
    <div style={{ padding: '24px 20px' }}>
      <div className="display" style={{ fontSize: 40, lineHeight: .95, whiteSpace: 'pre-line' }}>
        {done ? '측정이 끝났어요' : '카메라에\n손가락을 대주세요'}
      </div>
      <div className="body" style={{ marginTop: 10 }}>
        {done
          ? '심박존 4 · 러닝 직후 회복 구간이에요'
          : '약 12초간 측정하며, 측정 중에는 손가락을 떼지 마세요'}
      </div>

      {!done && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            background: measuring ? 'var(--ink)' : 'var(--soft-cloud)',
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: 'var(--radius-full)',
              border: `2px dashed ${measuring ? 'var(--canvas)' : 'var(--hairline)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: measuring ? 'var(--sale)' : 'var(--hairline)' }} />
            </div>
            <div className="cap" style={{ color: measuring ? 'var(--stone)' : 'var(--mute)' }}>
              카메라 미리보기 · 플래시 {measuring ? '켜짐' : '꺼짐'}
            </div>
          </div>

          {measuring && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 4, background: 'var(--hairline-soft)' }}>
                <div style={{ width: `${Math.round((run.scanSec / SCAN_SECONDS) * 100)}%`, height: '100%', background: 'var(--ink)', transition: 'width .4s linear' }} />
              </div>
              <div className="cap-sm" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>{Math.max(0, SCAN_SECONDS - run.scanSec)}초 남음</span>
                <span>초당 20프레임 수집</span>
              </div>
            </div>
          )}
        </div>
      )}

      {done && (
        <div style={{ marginTop: 20 }}>
          <div className="soft" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="cap-sm">측정 결과 · rPPG</div>
            <RingGauge size={160} outerPct={0.55} innerPct={0.65} value={146} label="146 BPM" />
            <div className="cap" style={{ color: 'var(--charcoal)' }}>BPM · 심박존 4</div>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            측정 시간<span className="v">12초</span>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            신호 품질<span className="v ok">양호 · 기록에 저장됨</span>
          </div>
        </div>
      )}
    </div>
  )
}
