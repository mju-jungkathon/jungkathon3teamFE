import { useEffect, useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import RunMap from './RunMap.jsx'
import { ChevronLeft, ChevronRight, XIcon } from './Icons.jsx'
import { WEEKDAYS } from '../data.js'
import { monthGrid, fmtPace, fmtClock, fmtDurationKor, uvBand, routeToSvgPath } from '../utils.js'
import { getRunningSessions, getRunningSessionDetail, createRecoveryGuide } from '../api/endpoints.js'

const SOURCE_LABEL = { WATCH: '워치 연동', RPPG: '손가락 측정' }

export default function History() {
  const [cal, setCal] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [selDay, setSelDay] = useState(new Date().getDate())
  const [sheetOpen, setSheetOpen] = useState(false)

  const [sessions, setSessions] = useState(null) // GET /running-sessions 목록 원본
  const [listErr, setListErr] = useState('')

  const [selected, setSelected] = useState(null) // 목록에서 고른 세션 요약 · null이면 그날의 목록 화면
  const [detail, setDetail] = useState(null)     // GET /running-sessions/{id} 상세
  const [guide, setGuide] = useState(null)       // POST .../recovery-guide (idempotent 재조회)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailErr, setDetailErr] = useState('')

  // 달력 넘길 때마다 다시 부르지 않도록 넉넉한 범위를 한 번만 조회
  useEffect(() => {
    let cancelled = false
    getRunningSessions('365d')
      .then((d) => {
        // E4090(이미 진행 중인 세션) 충돌을 풀려고 앱이 자동으로 강제 종료한 좀비 세션(distanceKm 0,
        // COMPLETED 아님)은 사용자가 실제로 뛴 기록이 아니므로 기록 화면에서 제외한다.
        const records = (d.records || []).filter((r) => !(r.distanceKm === 0 && r.status !== 'COMPLETED'))
        if (!cancelled) setSessions(records)
      })
      .catch((err) => { if (!cancelled) setListErr(err.message || '기록을 불러오지 못했어요') })
    return () => { cancelled = true }
  }, [])

  // 표시 중인 연/월에 해당하는 세션만 "일 → 세션 목록"(하루에 여러 번 뛴 경우 대비) 맵으로 정리
  const records = useMemo(() => {
    const map = {}
    for (const s of sessions || []) {
      const d = new Date(s.startedAt)
      if (d.getFullYear() === cal.year && d.getMonth() === cal.month) {
        ;(map[d.getDate()] ??= []).push(s)
      }
    }
    for (const day in map) map[day].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    return map
  }, [sessions, cal])

  const list = Object.values(records).flat()
  const bpms = list.filter((r) => r.avgBpm != null && r.avgBpm > 0)
  const dayRecords = records[selDay] || []

  const shift = (n) => () => {
    const dt = new Date(cal.year, cal.month + n, 1)
    setCal({ year: dt.getFullYear(), month: dt.getMonth() })
    setSelDay(1)
  }

  const openDay = (day) => {
    setSelDay(day)
    setSheetOpen(true)
    setSelected(null) // 항상 그날의 목록부터 보여준다
  }

  const selectSession = (summary) => {
    setSelected(summary)
    setDetail(null)
    setGuide(null)
    setDetailErr('')
    setDetailLoading(true)

    getRunningSessionDetail(summary.runningSessionId)
      .then((d) => {
        setDetail(d)
        // 완료된 세션만 회복 가이드가 있다 — idempotent라 다시 불러도 안전
        if (d.status === 'COMPLETED') {
          return createRecoveryGuide(summary.runningSessionId).then(setGuide).catch(() => {})
        }
      })
      .catch((err) => setDetailErr(err.message || '기록을 불러오지 못했어요'))
      .finally(() => setDetailLoading(false))
  }

  const svg = detail ? routeToSvgPath(detail.routePath) : null

  return (
    <>
      <div className="hdr">
        <span className="wordmark">기록</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="icon-btn plain" onClick={shift(-1)} aria-label="이전 달"><ChevronLeft size={18} /></button>
          <span style={{ minWidth: 88, textAlign: 'center', font: 'var(--type-body-strong)' }}>
            {cal.year}년 {cal.month + 1}월
          </span>
          <button className="icon-btn plain" onClick={shift(1)} aria-label="다음 달"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 88 }}>
        {listErr && <div className="body" style={{ padding: 20, color: 'var(--sale)' }}>{listErr}</div>}

        <div className="stat-grid c3 bordered-b section">
          <div className="stat"><div className="k">러닝</div><div className="n">{list.length}회</div></div>
          <div className="stat"><div className="k">거리</div><div className="n">{list.reduce((a, r) => a + (r.distanceKm || 0), 0).toFixed(1)}km</div></div>
          <div className="stat">
            <div className="k">평균 심박</div>
            <div className="n hr">{bpms.length ? Math.round(bpms.reduce((a, r) => a + r.avgBpm, 0) / bpms.length) : '-'}</div>
          </div>
        </div>

        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {WEEKDAYS.map((w, i) => (
              <div key={w} style={{ textAlign: 'center', font: 'var(--type-caption-sm)', fontSize: 11, paddingBottom: 8, color: i === 0 ? 'var(--sale)' : 'var(--mute)' }}>
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {monthGrid(cal.year, cal.month).map((day, i) => {
              if (day == null) return <div key={`b${i}`} style={{ height: 46 }} />
              const r = records[day]
              const sel = day === selDay
              const failed = r?.length && r.every((s) => s.avgBpm == null || s.avgBpm === 0)
              return (
                <button
                  key={day}
                  className="press"
                  onClick={() => openDay(day)}
                  style={{ height: 46, border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit' }}
                >
                  <span
                    className="display"
                    style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-full)', fontSize: 17,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: sel ? 'var(--ink)' : 'transparent',
                      color: sel ? 'var(--canvas)' : r ? 'var(--ink)' : 'var(--stone)',
                    }}
                  >
                    {day}
                  </span>
                  <span style={{
                    width: 4, height: 4, borderRadius: 'var(--radius-full)',
                    background: r && !sel ? (failed ? 'var(--sale)' : 'var(--ink)') : 'transparent',
                  }} />
                </button>
              )
            })}
          </div>

          <div className="cap-sm" style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            날짜를 눌러 그날의 러닝 기록을 확인하세요
          </div>
        </div>
      </div>

      {sheetOpen && (
        <Sheet padded={false} label="러닝 기록" onClose={() => setSheetOpen(false)}>
          {(close) => (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', boxShadow: 'var(--elevation-inset-bottom)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {selected && (
                    <button className="icon-btn plain" onClick={() => setSelected(null)} aria-label="목록으로" style={{ marginLeft: -8 }}>
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <div>
                    <div className="sheet-title">{cal.month + 1}월 {selDay}일</div>
                    <div className="cap-sm" style={{ marginTop: 4 }}>
                      {selected
                        ? (detail ? `${fmtClock(detail.startedAt)} · ${fmtDurationKor(detail.durationSec)}` : '')
                        : (dayRecords.length ? `${dayRecords.length}건의 러닝` : '')}
                    </div>
                  </div>
                </div>
                <button className="icon-btn" onClick={close} aria-label="닫기"><XIcon size={18} /></button>
              </div>

              {!selected ? (
                dayRecords.length === 0 ? (
                  <div style={{ padding: '44px 20px', textAlign: 'center', animation: 'agRise .3s ease both' }}>
                    <div className="h-lg">이 날은 러닝 기록이 없어요</div>
                    <div className="body" style={{ color: 'var(--mute)', marginTop: 8 }}>점이 찍힌 날짜를 눌러 확인해보세요</div>
                  </div>
                ) : (
                  <div style={{ animation: 'agRise .3s ease both' }}>
                    {dayRecords.map((s) => {
                      const failedRun = s.avgBpm == null || s.avgBpm === 0
                      return (
                        <button
                          key={s.runningSessionId}
                          className="press"
                          onClick={() => selectSession(s)}
                          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', border: 'none', borderTop: '1px solid var(--hairline)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <div>
                            <div style={{ font: 'var(--type-body-strong)' }}>{fmtClock(s.startedAt)}</div>
                            <div className="cap-sm" style={{ marginTop: 4, color: 'var(--mute)' }}>
                              {(s.distanceKm ?? 0).toFixed(2)}km · {fmtDurationKor(s.durationSec)}
                              {failedRun ? ' · 측정 실패' : ` · ${s.avgBpm}BPM`}
                            </div>
                          </div>
                          <ChevronRight size={18} style={{ color: 'var(--mute)', flex: 'none' }} />
                        </button>
                      )
                    })}
                  </div>
                )
              ) : detailLoading ? (
                <div style={{ padding: '44px 20px', textAlign: 'center' }} className="cap-sm">불러오는 중…</div>
              ) : detailErr ? (
                <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                  <div className="body" style={{ color: 'var(--sale)' }}>{detailErr}</div>
                </div>
              ) : detail ? (
                <div style={{ animation: 'agRise .3s ease both' }}>
                  <RunMap
                    path={svg?.d ?? null}
                    start={svg?.start}
                    caption={detail.routePath?.length ? `GPS 경로 · 지점 ${detail.routePath.length}개` : '경로 정보 없음'}
                  />

                  <div className="stat-grid c2 section">
                    <div className="stat bordered-b"><div className="k">이동 거리</div><div className="n xl">{(detail.distanceKm ?? 0).toFixed(2)}<span className="u">km</span></div></div>
                    <div className="stat bordered-b"><div className="k">평균 페이스</div><div className="n xl">{fmtPace(detail.durationSec, detail.distanceKm)}</div></div>
                    <div className="stat">
                      <div className="k">평균 심박</div>
                      <div className="n xl hr">
                        {detail.heartRate?.avgBpm ? detail.heartRate.avgBpm : '측정 실패'}
                        {detail.heartRate?.avgBpm ? <span className="u">BPM</span> : null}
                      </div>
                      {detail.heartRate?.heartRateSource && (
                        <div className="cap-sm" style={{ marginTop: 2 }}>{SOURCE_LABEL[detail.heartRate.heartRateSource] || detail.heartRate.heartRateSource}</div>
                      )}
                    </div>
                    <div className="stat"><div className="k">UV 지수</div><div className="n xl">{detail.uvIndexAtStart}<span className="u">{uvBand(detail.uvIndexAtStart)}</span></div></div>
                  </div>

                  {guide ? (
                    <div className="soft" style={{ padding: 20, marginTop: 8 }}>
                      <div className="h-lg">그날의 회복 솔루션</div>
                      <div className="body" style={{ marginTop: 8 }}>{guide.summaryMessage}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                        {(guide.actions || []).map((a) => (
                          <div key={a.type} style={{ padding: '14px 0', borderTop: '1px solid var(--hairline)' }}>
                            <div style={{ font: 'var(--type-body-md)' }}>{a.title}</div>
                            <div className="cap-sm" style={{ marginTop: 4, color: 'var(--mute)' }}>{a.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : detail.status !== 'COMPLETED' ? (
                    <div className="soft" style={{ padding: 20, marginTop: 8 }}>
                      <div className="cap-sm">아직 진행 중이거나 완료되지 않은 세션이라 회복 솔루션이 없어요</div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={{ padding: 20 }}>
                <button className="btn lg full secondary" onClick={close}>닫기</button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </>
  )
}
