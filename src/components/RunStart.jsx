export default function RunStart({ onStart }) {
  return (
    <section className="page">
      <div className="label">러닝</div>
      <div className="title">오늘도 뛸 준비 됐나요</div>
      <div className="sub">현재 위치 기준 UV 지수 6 · 러닝하기 좋은 시간대예요</div>

      <div className="box-dash">
        <div className="t">출발 전 스트레칭 <span className="badge">선택 사항</span></div>
        <div className="d">발목·종아리 위주 3분 루틴</div>
        <button className="btn block">스트레칭 시작하기</button>
      </div>

      <div className="box">
        <div className="line-item"><span>현재 위치</span><span className="v">서울 성동구</span></div>
        <div className="line-item"><span>UV 지수</span><span className="v">6 · 보통</span></div>
      </div>

      <button className="btn block primary" onClick={onStart}>러닝 시작하기</button>
    </section>
  )
}
