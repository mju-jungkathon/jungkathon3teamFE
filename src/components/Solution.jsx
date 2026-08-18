import { useEffect, useRef, useState } from 'react'

const TOTAL_SECONDS = 5 * 60

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Solution({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(TOTAL_SECONDS)
      setRunning(true)
    } else {
      setRunning((r) => !r)
    }
  }

  const finished = secondsLeft === 0
  const pct = Math.round(((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100)

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

      <div className="box" style={{ textAlign: 'center' }}>
        <div className="t" style={{ justifyContent: 'center' }}>쿨다운 타이머</div>
        <div className="timer-ring" style={{ '--pct': running || secondsLeft < TOTAL_SECONDS ? pct : 0 }}>
          <div className="face">
            <div className="tt">{formatTime(secondsLeft)}</div>
            <div className="td">{finished ? '완료' : running ? '진행 중' : '대기'}</div>
          </div>
        </div>
        <button className="btn block primary" onClick={toggleTimer}>
          {finished ? '다시 시작' : running ? '일시정지' : secondsLeft < TOTAL_SECONDS ? '이어서 시작' : '타이머 시작'}
        </button>
      </div>

      <button className="btn block primary" onClick={onComplete}>완료하고 리포트 보기</button>
    </section>
  )
}