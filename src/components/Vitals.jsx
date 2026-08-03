import { useState } from 'react'

export default function Vitals({ onGoScan, onUseWatch }) {
  const [source, setSource] = useState(null)

  return (
    <section className="page">
      <div className="label">심박수 확인</div>
      <div className="title">심박수는 어떻게 확인할까요</div>
      <div className="sub">워치가 있다면 워치 데이터를, 없다면 손가락 측정으로 확인해요</div>

      <div className="tabs">
        <div className={`tab-opt ${source === 'watch' ? 'on' : ''}`} onClick={() => setSource('watch')}>워치 있어요</div>
        <div className={`tab-opt ${source === 'rppg' ? 'on' : ''}`} onClick={() => setSource('rppg')}>워치 없어요</div>
      </div>

      {source === 'watch' && (
        <div className="box">
          <div className="t">워치 데이터를 불러왔어요</div>
          <div className="line-item"><span>평균 심박수</span><span className="v">152bpm</span></div>
          <div className="line-item"><span>최고 심박수</span><span className="v">168bpm</span></div>
          <div className="line-item"><span>심박변이도(HRV)</span><span className="v">42ms</span></div>
          <button className="btn block primary" onClick={onUseWatch}>이 데이터로 솔루션 받기</button>
        </div>
      )}

      {source === 'rppg' && (
        <div className="box-dash">
          <div className="t">손가락으로 측정할게요</div>
          <div className="d">후면 카메라와 플래시에 손가락을 밀착시켜 약 12초간 측정해요</div>
          <button className="btn block primary" onClick={onGoScan}>측정 화면으로 이동</button>
        </div>
      )}

      {!source && (
        <div className="box">
          <div className="d">위 두 옵션 중 하나를 선택해주세요</div>
        </div>
      )}
    </section>
  )
}
