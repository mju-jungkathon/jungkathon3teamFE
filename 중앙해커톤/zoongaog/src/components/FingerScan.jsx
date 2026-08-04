import { useState } from 'react'

export default function FingerScan({ onFinishScan }) {
  const [stage, setStage] = useState('idle') // idle | measuring | done

  return (
    <section className="page">
      <div className="label">손가락 측정 · rPPG</div>
      <div className="title">후면 카메라 + 플래시에 손가락을 대주세요</div>
      <div className="sub">약 12초간 측정하며, 측정 중에는 손가락을 떼지 마세요</div>

      {stage === 'idle' && (
        <>
          <div className="box-dash" style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
            카메라 미리보기 · 플래시 꺼짐
          </div>
          <button className="btn block primary" onClick={() => setStage('measuring')}>측정 시작</button>
        </>
      )}

      {stage === 'measuring' && (
        <>
          <div className="box-dash" style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
            카메라 미리보기 · 플래시 켜짐
          </div>
          <div className="measure-bar"><i style={{ width: '68%' }}></i></div>
          <div className="sub" style={{ marginTop: 6 }}>8초 남음 · 프레임 초당 20회 수집 중</div>
          <button className="btn block" disabled>측정 중.. 손가락을 떼지 마세요</button>
          <button className="btn block" onClick={() => setStage('done')} style={{ marginTop: 8 }}>측정 완료로 넘어가기(모의)</button>
        </>
      )}

      {stage === 'done' && (
        <>
          <div className="result-hero">
            <div className="rl">측정 결과 · rPPG</div>
            <div className="rv">146</div>
            <div className="ru">BPM</div>
          </div>
          <div className="box">
            <div className="line-item"><span>측정 시간</span><span className="v">12초</span></div>
            <div className="line-item"><span>백엔드 전송</span><span className="v">전송 완료</span></div>
            <span className="status-ok">기록에 저장됨</span>
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            신호가 충분하지 않을 경우 "신호가 충분하지 않습니다. 손가락 밀착을 확인하고 다시 시도해주세요." 안내와 함께 재측정을 요청해요.
          </div>
          <button className="btn block primary" onClick={onFinishScan}>솔루션 확인하기</button>
        </>
      )}
    </section>
  )
}
