import { useState } from 'react'
import RingGauge from './RingGauge.jsx'
import { selectHeartRateSource, uploadWatchHeartRate, linkAppleHealth } from '../api/endpoints.js'
import { readLatestWorkoutHeartRate } from '../health.js'

export default function Vitals({ run, setRun }) {
  // idle | loading | done | empty | error
  const [watch, setWatch] = useState('idle')

  const pick = (source) => async () => {
    setRun((r) => ({ ...r, source, scanResult: null }))
    // 선택값 자체는 서버에 저장되지 않는다(흐름 기록용) — 실패해도 로컬 분기를 막지 않는다.
    selectHeartRateSource(run.sessionId, source.toUpperCase()).catch(() => {})
    if (source !== 'watch') return

    setWatch('loading')
    try {
      const hr = await readLatestWorkoutHeartRate()
      if (!hr) return setWatch('empty')

      setRun((r) => ({ ...r, scanResult: hr }))
      setWatch('done')
      linkAppleHealth(true).catch(() => {})
      uploadWatchHeartRate(run.sessionId, hr).catch(() => {})
    } catch {
      setWatch('error')
    }
  }

  const hr = run.scanResult

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
          {watch === 'loading' && (
            <div className="soft" style={{ padding: 24, textAlign: 'center' }}>
              <div className="body">건강 앱에서 러닝 기록을 불러오는 중이에요</div>
            </div>
          )}

          {watch === 'empty' && (
            <div className="soft" style={{ padding: 18 }}>
              <div style={{ font: 'var(--type-body-strong)' }}>최근 러닝 기록이 없어요</div>
              <div className="body" style={{ marginTop: 6 }}>
                24시간 안에 기록된 러닝이 없습니다. 카메라 측정으로 진행해보세요
              </div>
            </div>
          )}

          {watch === 'error' && (
            <div className="soft" style={{ padding: 18 }}>
              <div style={{ font: 'var(--type-body-strong)' }}>건강 데이터를 읽지 못했어요</div>
              <div className="body" style={{ marginTop: 6 }}>
                설정 → 개인정보 보호 및 보안 → 건강에서 AfterGrow 권한을 확인해주세요
              </div>
            </div>
          )}

          {watch === 'done' && hr && (
            <>
              <div className="soft" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div className="cap-sm">워치 데이터 · 평균 심박수</div>
                <RingGauge size={160} outerPct={0.55} innerPct={0.75} value={hr.avgBpm} label={`${hr.avgBpm} BPM`} />
                <div className="cap" style={{ color: 'var(--charcoal)' }}>BPM · 최고 {hr.maxBpm}</div>
              </div>
              {hr.hrvMs != null && (
                <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
                  심박변이도(HRV)<span className="v">{hr.hrvMs}ms</span>
                </div>
              )}
              <div className="row" style={{ borderTop: 'none' }}>UV 노출<span className="v">지수 6 · 38분</span></div>
            </>
          )}
        </div>
      )}

      {run.source === 'rppg' && (
        <div className="soft" style={{ padding: 18, marginTop: 22 }}>
          <div style={{ font: 'var(--type-body-strong)' }}>손가락으로 측정할게요</div>
          <div className="body" style={{ marginTop: 6 }}>후면 카메라와 플래시에서 5~10cm 거리를 유지한 채 약 12초간 측정해요</div>
        </div>
      )}
    </div>
  )
}