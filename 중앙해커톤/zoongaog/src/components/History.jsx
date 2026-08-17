import { useState } from 'react'
import Sheet from './Sheet.jsx'

const RECORDS = [
  { date: '오늘 07:42', method: '손가락 측정(rPPG)', bpm: 146, status: 'ok', sessionId: 'sess_9f2a...', distance: '4.8km', duration: '24분 12초', hrv: '38ms' },
  { date: '어제 06:58', method: '워치 데이터', bpm: 152, status: 'ok', sessionId: 'sess_7c11...', distance: '5.2km', duration: '27분 40초', hrv: '42ms' },
  { date: '8/1 07:10', method: '손가락 측정(rPPG)', bpm: null, status: 'fail', sessionId: 'sess_4b09...', distance: '3.9km', duration: '21분 05초', hrv: '—' },
  { date: '7/30 07:33', method: '워치 데이터', bpm: 149, status: 'ok', sessionId: 'sess_2e77...', distance: '4.5km', duration: '23분 50초', hrv: '40ms' },
]

export default function History() {
  const [selected, setSelected] = useState(null)

  return (
    <section className="page">
      <div className="label">기록</div>
      <div className="title">측정 기록</div>
      <div className="sub">러닝마다 저장된 심박수 측정 결과예요 · 항목을 눌러 자세히 볼 수 있어요</div>

      <div className="box">
        {RECORDS.map((r) => (
          <div className="list-row" key={r.sessionId} onClick={() => setSelected(r)}>
            <div>
              <div className="lt">{r.date} · {r.method}</div>
              <div className="ld">세션 ID {r.sessionId}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="lv">{r.bpm ? `${r.bpm} BPM` : '측정 실패'}</div>
              {r.status === 'ok'
                ? <span className="status-ok">전송 완료</span>
                : <span className="status-fail">전송 실패 · 재측정 필요</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="divider"><span className="label">측정 방식 비율</span><div className="ln"></div></div>
      <div className="box">
        <div className="line-item"><span>워치 데이터</span><span className="v">2회</span></div>
        <div className="line-item"><span>손가락 측정(rPPG)</span><span className="v">2회 (실패 1회 포함)</span></div>
      </div>

      {selected && (
        <Sheet eyebrow={selected.date} title="측정 상세" onClose={() => setSelected(null)}>
          {selected.status === 'ok' ? (
            <div className="result-hero" style={{ marginTop: 0 }}>
              <div className="rl">{selected.method}</div>
              <div className="rv">{selected.bpm}</div>
              <div className="ru">BPM</div>
            </div>
          ) : (
            <div className="box-dash" style={{ marginTop: 0 }}>
              <div className="t">측정 실패</div>
              <div className="d">신호가 충분하지 않았어요. 손가락 밀착을 확인하고 다시 시도해주세요.</div>
            </div>
          )}
          <div className="box">
            <div className="line-item"><span>거리</span><span className="v">{selected.distance}</span></div>
            <div className="line-item"><span>시간</span><span className="v">{selected.duration}</span></div>
            <div className="line-item"><span>심박변이도(HRV)</span><span className="v">{selected.hrv}</span></div>
            <div className="line-item"><span>세션 ID</span><span className="v">{selected.sessionId}</span></div>
          </div>
          <button className="btn block primary" onClick={() => setSelected(null)}>닫기</button>
        </Sheet>
      )}
    </section>
  )
}