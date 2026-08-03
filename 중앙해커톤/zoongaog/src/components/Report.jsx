const WEEK = [
  { d: '월', h: 40 }, { d: '화', h: 55 }, { d: '수', h: 30 }, { d: '목', h: 65 },
  { d: '금', h: 45 }, { d: '토', h: 80 }, { d: '일', h: 50 },
]

export default function Report() {
  return (
    <section className="page">
      <div className="label">리포트</div>
      <div className="title">이번 주 러닝 리포트</div>
      <div className="sub">케이던스·심박·스트레스 데이터를 모아봤어요</div>

      <div className="bars">
        {WEEK.map((w) => (
          <div className="bar" key={w.d}>
            <div className="col" style={{ height: `${w.h}%` }}></div>
            <div className="dd">{w.d}</div>
          </div>
        ))}
      </div>

      <div className="box">
        <div className="d">이번 주 총 4회 러닝, 평균 강도 중상. 목요일 심박수가 가장 높았어요.</div>
        <div className="tag-row">
          <span className="tag-plain">평균 UV 지수 5.8</span>
          <span className="tag-plain">평균 거리 4.6km</span>
        </div>
      </div>

      <div className="divider"><span className="label">이번 주 심박 데이터 소스</span><div className="ln"></div></div>
      <div className="box">
        <div className="line-item"><span>워치 데이터 사용</span><span className="v">3회</span></div>
        <div className="line-item"><span>rPPG(촬영) 사용</span><span className="v">1회</span></div>
      </div>
    </section>
  )
}
