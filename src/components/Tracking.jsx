import { useEffect, useState } from 'react'
import RunMap from './RunMap.jsx'

const AVG_SPEED_MPS = 2.8 // 대략 6'00"/km 페이스 (시뮬레이션용)

function formatElapsed(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function formatPace(elapsedSeconds, distanceKm) {
  if (distanceKm <= 0) return "--'--\""
  const secPerKm = elapsedSeconds / distanceKm
  const m = Math.floor(secPerKm / 60)
  const s = String(Math.round(secPerKm % 60)).padStart(2, '0')
  return `${m}'${s}"`
}

export default function Tracking({ onFinish }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const distanceKm = (elapsedSeconds * AVG_SPEED_MPS) / 1000
  const distanceLabel = `${distanceKm.toFixed(2)}km`
  const paceLabel = formatPace(elapsedSeconds, distanceKm)

  return (
    <section className="page">
      <div className="label">트래킹</div>
      <div className="title">러닝 진행 중</div>
      <div className="sub">종료를 누르면 오늘의 데이터가 정리돼요 · 실제 GPS는 연동 전이라 경로는 예시예요</div>

      <RunMap elapsedSeconds={elapsedSeconds} distanceLabel={distanceLabel} paceLabel={paceLabel} />

      <div className="box">
        <div className="line-item"><span>경과 시간</span><span className="v">{formatElapsed(elapsedSeconds)}</span></div>
        <div className="line-item"><span>강도</span><span className="v">중강도</span></div>
        <div className="line-item"><span>거리</span><span className="v">{distanceLabel}</span></div>
        <div className="line-item"><span>페이스</span><span className="v">{paceLabel} /km</span></div>
        <div className="line-item"><span>심박수</span><span className="v">종료 후 확인</span></div>
        <div className="line-item"><span>스트레스</span><span className="v">심박변이도로 계산 예정</span></div>
        <div className="line-item"><span>UV 지수</span><span className="v">6 · 보통</span></div>
      </div>

      <button className="btn block primary" onClick={onFinish}>러닝 종료</button>
    </section>
  )
}