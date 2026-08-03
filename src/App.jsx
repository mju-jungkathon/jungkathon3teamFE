import { useState, useRef } from 'react'
import Home from './components/Home.jsx'
import RunStart from './components/RunStart.jsx'
import Tracking from './components/Tracking.jsx'
import Vitals from './components/Vitals.jsx'
import FingerScan from './components/FingerScan.jsx'
import Solution from './components/Solution.jsx'
import History from './components/History.jsx'
import Profile from './components/Profile.jsx'
import TabBar from './components/TabBar.jsx'

const RUN_STEPS = { start: RunStart, tracking: Tracking, vitals: Vitals, scan: FingerScan, solution: Solution }

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [runStep, setRunStep] = useState('start')
  const bodyRef = useRef(null)

  const goTab = (id) => {
    setActiveTab(id)
    if (id === 'run') setRunStep('start')
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }

  const goRunStep = (step) => {
    setRunStep(step)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }

  const renderBody = () => {
    if (activeTab === 'home') {
      return <Home onGoRun={() => goTab('run')} onGoHistory={() => goTab('history')} />
    }
    if (activeTab === 'history') return <History />
    if (activeTab === 'profile') return <Profile />

    // activeTab === 'run' : 다단계 흐름
    const RunScreen = RUN_STEPS[runStep]
    return (
      <RunScreen
        onStart={() => goRunStep('tracking')}
        onFinish={() => goRunStep('vitals')}
        onGoScan={() => goRunStep('scan')}
        onUseWatch={() => goRunStep('solution')}
        onFinishScan={() => goRunStep('solution')}
        onComplete={() => goTab('history')}
      />
    )
  }

  return (
    <div className="stage">
      <div className="lead">
        <h1>AURA — 와이어프레임</h1>
        <p>홈 → 러닝(트래킹→심박확인→측정→솔루션) → 기록 → 프로필. 디자인 요소 없음, 배치 확인용.</p>
      </div>

      <div className="device">
        <div className="screen">
          <div className="statusbar">
            <span>9:41</span>
            <span>상태바 자리</span>
          </div>

          <div className="body" ref={bodyRef}>
            {renderBody()}
          </div>

          <TabBar active={activeTab} onChange={goTab} />
        </div>
      </div>

      <div className="foot">홈 → 러닝(트래킹→심박확인→측정→솔루션) → 기록 → 프로필</div>
    </div>
  )
}
