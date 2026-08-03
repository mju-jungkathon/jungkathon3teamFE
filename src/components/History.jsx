const RECORDS = [
  { date: '오늘 07:42', method: '손가락 측정(rPPG)', bpm: 146, status: 'ok', sessionId: 'sess_9f2a...' },
  { date: '어제 06:58', method: '워치 데이터', bpm: 152, status: 'ok', sessionId: 'sess_7c11...' },
  { date: '8/1 07:10', method: '손가락 측정(rPPG)', bpm: null, status: 'fail', sessionId: 'sess_4b09...' },
  { date: '7/30 07:33', method: '워치 데이터', bpm: 149, status: 'ok', sessionId: 'sess_2e77...' },
]

export default function History() {
  return (
    <section className="page">
      <div className="label">기록</div>
      <div className="title">측정 기록</div>
      <div className="sub">러닝마다 저장된 심박수 측정 결과예요</div>

      <div className="box">
        {RECORDS.map((r) => (
          <div className="list-row" key={r.sessionId}>
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
    </section>
  )
}
