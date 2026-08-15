import { useState } from 'react'
import Sheet from './Sheet.jsx'
import RunMap from './RunMap.jsx'
import { ChevronLeft, ChevronRight, XIcon } from './Icons.jsx'
import { RECORDS, RECORD_YEAR, RECORD_MONTH, WEEKDAYS, PATH_B } from '../data.js'
import { monthGrid } from '../utils.js'

export default function History() {
  const [cal, setCal] = useState({ year: RECORD_YEAR, month: RECORD_MONTH })
  const [selDay, setSelDay] = useState(15)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 목업 데이터는 2026년 8월치만 있다 — 다른 달은 빈 달로 보여준다
  const records = cal.year === RECORD_YEAR && cal.month === RECORD_MONTH ? RECORDS : {}
  const list = Object.values(records)
  const bpms = list.filter((r) => r.bpm != null)
  const rec = records[selDay]

  const shift = (n) => () => {
    const dt = new Date(cal.year, cal.month + n, 1)
    setCal({ year: dt.getFullYear(), month: dt.getMonth() })
    setSelDay(1)
  }

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
        <div className="stat-grid c3 bordered-b section">
          <div className="stat"><div className="k">러닝</div><div className="n">{list.length}회</div></div>
          <div className="stat"><div className="k">거리</div><div className="n">{list.reduce((a, r) => a + parseFloat(r.km), 0).toFixed(1)}km</div></div>
          <div className="stat">
            <div className="k">평균 심박</div>
            <div className="n hr">{bpms.length ? Math.round(bpms.reduce((a, r) => a + r.bpm, 0) / bpms.length) : '-'}</div>
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
              return (
                <button
                  key={day}
                  className="press"
                  onClick={() => { setSelDay(day); setSheetOpen(true) }}
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
                    background: r && !sel ? (r.bpm == null ? 'var(--sale)' : 'var(--ink)') : 'transparent',
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
        <Sheet padded={false} label="러닝 기록 상세" onClose={() => setSheetOpen(false)}>
          {(close) => (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', boxShadow: 'var(--elevation-inset-bottom)' }}>
                <div>
                  <div className="sheet-title">{cal.month + 1}월 {selDay}일</div>
                  <div className="cap-sm" style={{ marginTop: 4 }}>{rec ? rec.time : ''}</div>
                </div>
                <button className="icon-btn" onClick={close} aria-label="닫기"><XIcon size={18} /></button>
              </div>

              {rec ? (
                <div style={{ animation: 'agRise .3s ease both' }}>
                  <RunMap
                    path={rec.path}
                    start={rec.path === PATH_B ? [48, 128] : [62, 146]}
                    caption={`경로 · ${rec.route}`}
                  />

                  <div className="stat-grid c2 section">
                    <div className="stat bordered-b"><div className="k">이동 거리</div><div className="n xl">{rec.km}<span className="u">km</span></div></div>
                    <div className="stat bordered-b"><div className="k">평균 페이스</div><div className="n xl">{rec.pace}</div></div>
                    <div className="stat">
                      <div className="k">평균 심박</div>
                      <div className="n xl hr">{rec.bpm == null ? '측정 실패' : rec.bpm}{rec.bpm != null && <span className="u">BPM</span>}</div>
                    </div>
                    <div className="stat"><div className="k">UV 지수</div><div className="n xl">{rec.uv}<span className="u">{rec.uvLabel}</span></div></div>
                  </div>

                  <div className="soft" style={{ padding: 20, marginTop: 8 }}>
                    <div className="h-lg">그날의 회복 솔루션</div>
                    <div className="body" style={{ marginTop: 8 }}>{rec.sol}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                      {rec.actions.map(([text, state]) => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderTop: '1px solid var(--hairline)' }}>
                          <span style={{ font: 'var(--type-body-md)' }}>{text}</span>
                          <span className="cap" style={{ color: state === '완료' ? 'var(--success)' : state === '진행 중' ? 'var(--ink)' : 'var(--mute)' }}>
                            {state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '44px 20px', textAlign: 'center', animation: 'agRise .3s ease both' }}>
                  <div className="h-lg">이 날은 러닝 기록이 없어요</div>
                  <div className="body" style={{ color: 'var(--mute)', marginTop: 8 }}>점이 찍힌 날짜를 눌러 확인해보세요</div>
                </div>
              )}

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
