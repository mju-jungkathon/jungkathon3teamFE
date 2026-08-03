export default function Home({ onGoRun, onGoHistory }) {
  return (
    <section className="page">
      <div className="label">홈</div>
      <div className="title">안녕하세요, 김러너님</div>
      <div className="sub">이번 주 3회 러닝 완료 · 목표까지 2회 남았어요</div>

      <div className="box">
        <div className="t">최근 측정 결과</div>
        <div className="line-item"><span>측정 방식</span><span className="v">손가락 측정(rPPG)</span></div>
        <div className="line-item"><span>심박수</span><span className="v">146 BPM</span></div>
        <div className="line-item"><span>측정 시각</span><span className="v">오늘 07:42</span></div>
        <button className="btn block" onClick={onGoHistory}>기록 전체 보기</button>
      </div>

      <div className="divider"><span className="label">오늘의 러닝</span><div className="ln"></div></div>
      <div className="box-dash">
        <div className="t">아직 오늘 러닝을 시작하지 않았어요</div>
        <div className="d">출발 전 스트레칭부터 시작해보세요</div>
        <button className="btn block primary" onClick={onGoRun}>러닝 시작하기</button>
      </div>

      <div className="divider"><span className="label">이번 주 요약</span><div className="ln"></div></div>
      <div className="grid3">
        <div className="cell">총 거리<b>14.2km</b></div>
        <div className="cell">평균 BPM<b>149</b></div>
        <div className="cell">누적 UV<b>보통</b></div>
      </div>
    </section>
  )
}
