export default function Tracking({ onFinish }) {
  return (
    <section className="page">
      <div className="label">트래킹</div>
      <div className="title">러닝 진행 중</div>
      <div className="sub">종료를 누르면 오늘의 데이터가 정리돼요</div>

      <div className="placeholder-circle">24:12<br /><span style={{ fontSize: 10 }}>경과 시간</span></div>

      <div className="box">
        <div className="line-item"><span>강도</span><span className="v">중강도</span></div>
        <div className="line-item"><span>시간</span><span className="v">24분 12초</span></div>
        <div className="line-item"><span>거리</span><span className="v">4.8km</span></div>
        <div className="line-item"><span>심박수</span><span className="v">종료 후 확인</span></div>
        <div className="line-item"><span>스트레스</span><span className="v">심박변이도로 계산 예정</span></div>
        <div className="line-item"><span>UV 지수</span><span className="v">6 · 보통</span></div>
      </div>

      <button className="btn block primary" onClick={onFinish}>러닝 종료</button>
    </section>
  )
}
