export default function Solution({ onComplete }) {
  return (
    <section className="page">
      <div className="label">솔루션</div>
      <div className="title">오늘의 회복 가이드</div>
      <div className="sub">러닝 데이터와 심박수를 기반으로 만들었어요</div>

      <div className="result-hero">
        <div className="rl">오늘 측정된 심박수</div>
        <div className="rv">146</div>
        <div className="ru">BPM</div>
      </div>

      <div className="box-dash">
        <div className="d">오늘 강도 높은 4.8km 러닝에 UV 지수 6까지 겹쳤어요. 수분 보충과 가벼운 스트레칭으로 마무리하는 걸 추천해요.</div>
      </div>

      <div className="box">
        <div className="t">수분 보충</div>
        <div className="d">500ml 물 또는 이온음료로 회복을 도와요</div>
      </div>
      <div className="box">
        <div className="t">쿨다운 스트레칭</div>
        <div className="d">종아리·햄스트링 위주 5분</div>
      </div>

      <div className="box">
        <div className="line-item"><span>쿨다운 타이머</span><span className="v">05:00</span></div>
        <button className="btn block">타이머 시작</button>
      </div>

      <button className="btn block primary" onClick={onComplete}>완료하고 리포트 보기</button>
    </section>
  )
}
