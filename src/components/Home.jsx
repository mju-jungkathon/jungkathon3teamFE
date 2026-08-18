import { useEffect, useState } from 'react'
import RingGauge from './RingGauge.jsx'
import { ChevronRight } from './Icons.jsx'
import { AVG_SPEED_MPS } from '../data.js'
import { fmtElapsed, fmtTodayLabel, fmtClock } from '../utils.js'
import { getHome, getUvForecast } from '../api/endpoints.js'

const SOURCE_LABEL = { WATCH: '워치 연동', RPPG: '손가락 측정' }

function currentHourBucket(hourly) {
  if (!hourly?.length) return null
  const h = new Date().getHours()
  const key = String(Math.floor(h / 2) * 2).padStart(2, '0')
  return hourly.find((x) => x.hour === key) || hourly[hourly.length - 1]
}

export default function Home({ run, onStartRun, onGoHistory }) {
  const [home, setHome] = useState(null)
  const [uv, setUv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hasSession = run.step !== 'start'
  const distanceKm = ((run.elapsed * AVG_SPEED_MPS) / 1000).toFixed(2)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const homeData = await getHome()
        if (!cancelled) setHome(homeData)
      } catch (err) {
        if (!cancelled) setError(err.message || '홈 정보를 불러오지 못했어요')
      } finally {
        if (!cancelled) setLoading(false)
      }

      // UV 예보는 위치 권한이 있어야 하므로 실패해도 홈 화면 자체는 그대로 보여준다
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const d = await getUvForecast(pos.coords.latitude, pos.coords.longitude)
            if (!cancelled) setUv(d)
          } catch {
            /* UV 위젯만 비워둔다 */
          }
        },
        () => {},
        { maximumAge: 10 * 60 * 1000, timeout: 8000 },
      )
    }

    load()
    return () => { cancelled = true }
  }, [])

  const nowBucket = uv ? currentHourBucket(uv.hourly) : null
  const lowHours = uv ? uv.hourly.filter((h) => h.uv <= 2).map((h) => `${h.hour}시`) : []

  if (loading) {
    return (
      <>
        <div className="hdr">
          <span className="wordmark">AFTERGROW</span>
          <span className="cap-sm">{fmtTodayLabel()}</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }} className="cap-sm">불러오는 중…</div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="hdr">
          <span className="wordmark">AFTERGROW</span>
          <span className="cap-sm">{fmtTodayLabel()}</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="body">{error}</div>
          <button className="btn secondary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </>
    )
  }

  const measurement = home?.latestMeasurement

  return (
    <>
      <div className="hdr">
        <span className="wordmark">AFTERGROW</span>
        <span className="cap-sm">{fmtTodayLabel()}</span>
      </div>

      <div className="scroll" style={{ paddingBottom: 186 }}>
        <img
          src="https://picsum.photos/seed/aftergrow-seoul-morning-run/780/500"
          alt="아침 러닝"
          style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', background: 'var(--soft-cloud)' }}
        />

        <div style={{ padding: '20px 20px 0' }}>
          <div className="display" style={{ fontSize: 56 }}>{home?.greeting}</div>
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div className="h-lg">자외선 예보</div>
            <div className="cap-sm">기상청 · 현재 위치 기준</div>
          </div>

          {uv ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
                {uv.hourly.map((h) => {
                  const isNow = nowBucket && h.hour === nowBucket.hour
                  return (
                    <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div className="display" style={{ fontSize: 15, lineHeight: 1, color: isNow ? 'var(--ink)' : 'var(--mute)' }}>{h.uv}</div>
                      <div style={{
                        width: '100%',
                        height: Math.round(12 + (h.uv / 11) * 44),
                        background: isNow ? 'var(--ink)' : h.uv >= 6 ? 'var(--charcoal)' : 'var(--hairline)',
                      }} />
                      <div style={{ font: 'var(--type-caption-sm)', fontSize: 11, color: isNow ? 'var(--ink)' : 'var(--mute)' }}>
                        {isNow ? '지금' : `${h.hour}시`}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px' }}>
                <div className="cap" style={{ color: 'var(--charcoal)' }}>UV 낮은 시간대</div>
                <div style={{ font: 'var(--type-body-strong)', color: 'var(--success)' }}>
                  {lowHours.length ? lowHours.join(', ') : '오늘은 없어요'}
                </div>
              </div>
            </>
          ) : (
            <div className="soft" style={{ padding: '14px 16px' }} >
              <div className="cap-sm">위치 권한을 허용하면 시간대별 UV 예보를 볼 수 있어요</div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
            <div className="h-lg">이번 주 목표</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="display" style={{ fontSize: 56 }}>{home?.weeklyRunCount ?? 0}</span>
              <span className="h-lg" style={{ color: 'var(--mute)' }}>/ {home?.weeklyGoalCount ?? 0}회</span>
            </div>
            <div className="cap" style={{ color: 'var(--charcoal)', paddingBottom: 6 }}>
              목표까지 {Math.max(0, home?.remainingToGoal ?? 0)}회
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: home?.weeklyGoalCount || 1 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, background: i < (home?.weeklyRunCount ?? 0) ? 'var(--ink)' : 'var(--hairline-soft)' }} />
            ))}
          </div>

          <div className="stat-grid c3 bordered-y">
            <div className="stat"><div className="k">누적 거리</div><div className="n" style={{ fontSize: 26 }}>{home?.weeklySummary?.totalDistanceKm ?? 0}<span style={{ fontSize: 14 }}>km</span></div></div>
            <div className="stat"><div className="k">평균 심박</div><div className="n hr" style={{ fontSize: 26 }}>{home?.weeklySummary?.avgBpm || '-'}</div></div>
            <div className="stat"><div className="k">누적 UV</div><div className="n" style={{ fontSize: 26 }}>{home?.weeklySummary?.cumulativeUvLevel || '-'}</div></div>
          </div>

          <button
            className="press"
            onClick={onGoHistory}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RingGauge
              size={72}
              outerPct={nowBucket ? nowBucket.uv / 11 : 0}
              innerPct={measurement?.avgBpm ? measurement.avgBpm / 200 : 0}
              label={measurement ? `최근 측정 ${measurement.avgBpm} BPM` : '최근 측정 기록 없음'}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cap-sm">최근 측정</div>
              {measurement ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span className="display" style={{ fontSize: 34, lineHeight: 1, color: 'var(--sale)' }}>{measurement.avgBpm}</span>
                    <span className="cap" style={{ color: 'var(--charcoal)' }}>BPM</span>
                  </div>
                  <div className="cap-sm" style={{ marginTop: 4 }}>
                    오늘 {fmtClock(measurement.measuredAt)} · {SOURCE_LABEL[measurement.heartRateSource] || measurement.heartRateSource}
                  </div>
                </>
              ) : (
                <div className="body" style={{ marginTop: 4, color: 'var(--mute)' }}>아직 측정 기록이 없어요</div>
              )}
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
