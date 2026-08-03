export default function Scan({ onFinishScan }) {
  return (
    <section className="page">
      <div className="label">촬영</div>
      <div className="title">정면을 봐주세요</div>
      <div className="sub">10초 동안 움직이지 않아야 정확해요</div>

      <div className="box-dash" style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
        촬영 중 · 8초 남음
      </div>

      <div className="box">
        <div className="line-item"><span>심박수</span><span className="v">146bpm</span></div>
        <div className="line-item"><span>심박변이도(HRV)</span><span className="v">38ms</span></div>
      </div>

      <button className="btn block primary" onClick={onFinishScan}>솔루션 확인하기</button>
    </section>
  )
}
