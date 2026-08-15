import RingGauge from './RingGauge.jsx'
import { ChevronRight } from './Icons.jsx'
import { UV_BY_HOUR, NOW_HOUR_LABEL, AVG_SPEED_MPS } from '../data.js'
import { fmtElapsed } from '../utils.js'

const UV_NOW = 6
const TODAY_LABEL = '8월 15일 토요일'
const WEEK_RANGE = '8/10 - 8/16'

export default function Home({ goal, run, onStartRun, onGoHistory }) {
  const doneCount = Math.min(3, goal.freq)
  const hasSession = run.step !== 'start'
  const distanceKm = ((run.elapsed * AVG_SPEED_MPS) / 1000).toFixed(2)

  return (
    <>
      <div className="hdr">
        <span className="wordmark">AFTERGROW</span>
        <span className="cap-sm">{TODAY_LABEL}</span>
      </div>

      <div className="scroll" style={{ paddingBottom: 186 }}>
        <img
          src="https://picsum.photos/seed/aftergrow-seoul-morning-run/780/500"
          alt="아침 러닝"
          style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', background: 'var(--soft-cloud)' }}
        />

        <div style={{ padding: '20px 20px 0' }}>
          <div className="display" style={{ fontSize: 64 }}>TODAY&apos;S UV {UV_NOW}</div>
          <div style={{ font: 'var(--type-body-strong)', color: 'var(--charcoal)', marginTop: 10 }}>
            최고 8 · 오전 11시-오후 3시는 노출을 피하세요
          </div>
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div className="h-lg">자외선 예보</div>
            <div className="cap-sm">기상청 · 서울 성동구</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
            {UV_BY_HOUR.map((h) => {
              const isNow = h.label === NOW_HOUR_LABEL
              return (
                <div key={h.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div className="display" style={{ fontSize: 15, lineHeight: 1, color: isNow ? 'var(--ink)' : 'var(--mute)' }}>{h.uv}</div>
                  <div style={{
                    width: '100%',
                    height: Math.round(12 + (h.uv / 8) * 44),
                    background: isNow ? 'var(--ink)' : h.uv >= 6 ? 'var(--charcoal)' : 'var(--hairline)',
                  }} />
                  <div style={{ font: 'var(--type-caption-sm)', fontSize: 11, color: isNow ? 'var(--ink)' : 'var(--mute)' }}>
                    {isNow ? '지금' : h.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px' }}>
            <div className="cap" style={{ color: 'var(--charcoal)' }}>러닝 추천 시간대</div>
            <div style={{ font: 'var(--type-body-strong)', color: 'var(--success)' }}>오전 6-9시 · 오후 6시 이후</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
            <div className="h-lg">이번 주 목표</div>
            <div className="cap-sm">{WEEK_RANGE}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="display" style={{ fontSize: 56 }}>{doneCount}</span>
              <span className="h-lg" style={{ color: 'var(--mute)' }}>/ {goal.freq}회</span>
            </div>
            <div className="cap" style={{ color: 'var(--charcoal)', paddingBottom: 6 }}>
              목표까지 {Math.max(0, goal.freq - doneCount)}회
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: goal.freq }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, background: i < doneCount ? 'var(--ink)' : 'var(--hairline-soft)' }} />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span className="cap">누적 거리</span>
              <span style={{ font: 'var(--type-body-strong)' }}>14.2 <span style={{ color: 'var(--mute)' }}>/ 25.0 km</span></span>
            </div>
            <div style={{ height: 4, background: 'var(--hairline-soft)' }}>
              <div style={{ width: '57%', height: '100%', background: 'var(--ink)' }} />
            </div>
          </div>

          <div className="stat-grid c3 bordered-y">
            <div className="stat"><div className="k">평균 페이스</div><div className="n" style={{ fontSize: 26 }}>5&apos;32&quot;</div></div>
            <div className="stat"><div className="k">평균 심박</div><div className="n hr" style={{ fontSize: 26 }}>149</div></div>
            <div className="stat"><div className="k">UV 노출</div><div className="n" style={{ fontSize: 26 }}>42분</div></div>
          </div>

          <button
            className="press"
            onClick={onGoHistory}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RingGauge size={72} outerPct={0.55} innerPct={0.65} label="최근 측정 146 BPM" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cap-sm">최근 측정</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span className="display" style={{ fontSize: 34, lineHeight: 1, color: 'var(--sale)' }}>146</span>
                <span className="cap" style={{ color: 'var(--charcoal)' }}>BPM</span>
                <span className="cap" style={{ color: 'var(--success)', marginLeft: 2 }}>회복 양호</span>
              </div>
              <div className="cap-sm" style={{ marginTop: 4 }}>오늘 07:42 · 손가락 측정</div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--mute)', flex: 'none' }} />
          </button>
        </div>
      </div>

      <div className="cta-dock above-tabs">
        <button className="btn lg full" onClick={onStartRun}>
          {hasSession ? '러닝 재개하기' : '러닝 시작하기'}
        </button>
        {hasSession && (
          <div className="cap-sm" style={{ textAlign: 'center', marginTop: 10 }}>
            진행 중 · {fmtElapsed(run.elapsed)} · {distanceKm}km
          </div>
        )}
      </div>
    </>
  )
}
