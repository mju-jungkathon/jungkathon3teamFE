import { useState, useRef } from 'react'
import Home from './components/Home.jsx'
import Tracking from './components/Tracking.jsx'
import Vitals from './components/Vitals.jsx'
import Scan from './components/Scan.jsx'
import Solution from './components/Solution.jsx'
import Report from './components/Report.jsx'
import TabBar from './components/TabBar.jsx'

const SCREENS = { home: Home, tracking: Tracking, vitals: Vitals, scan: Scan, solution: Solution, report: Report }

export default function App() {
  const [active, setActive] = useState('home')
  const bodyRef = useRef(null)

  const go = (id) => {
    setActive(id)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }

  const Screen = SCREENS[active]

  return (
    <div className="stage">
      <div className="lead">
        <h1>AURA — 와이어프레임</h1>
        <p>홈 → 트래킹 → 심박확인(워치/rPPG 분기) → 솔루션 → 리포트. 디자인 요소 없음, 배치 확인용.</p>
      </div>

      <div className="device">
        <div className="screen">
          <div className="statusbar">
            <span>9:41</span>
            <span>상태바 자리</span>
          </div>

          <div className="body" ref={bodyRef}>
            <Screen
              onStart={() => go('tracking')}
              onFinish={() => go('vitals')}
              onGoScan={() => go('scan')}
              onUseWatch={() => go('solution')}
              onFinishScan={() => go('solution')}
              onComplete={() => go('report')}
            />
          </div>

          <TabBar active={active} onChange={go} />
        </div>
      </div>

      <div className="foot">홈 → 트래킹 → 심박확인(워치 O/X 분기: rPPG or 워치) → 솔루션 → 리포트</div>
    </div>
  )
}
