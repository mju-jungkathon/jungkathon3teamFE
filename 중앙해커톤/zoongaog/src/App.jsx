import { useState, useRef } from 'react'
import Login from './components/Login.jsx'
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
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [runOpen, setRunOpen] = useState(false)
  const [runStep, setRunStep] = useState('start')
  const bodyRef = useRef(null)

  const goTab = (id) => {
    setActiveTab(id)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }

  const openRun = () => {
    setRunStep('start')
    setRunOpen(true)
  }

  const closeRun = (nextTab) => {
    setRunOpen(false)
    if (nextTab) goTab(nextTab)
  }

  const goRunStep = (step) => setRunStep(step)

  const RunScreen = RUN_STEPS[runStep]

  return (
    <div className="stage">
      <div className="lead">
        <h1>AURA — 와이어프레임</h1>
        <p>로그인 → 홈 → (러닝은 전체화면으로 전환) → 기록 → 프로필. 디자인 요소 없음, 배치 확인용.</p>
      </div>

      <div className="device">
        <div className="screen">
          <div className="statusbar">
            <span>9:41</span>
            <span>상태바 자리</span>
          </div>

          <div className="body" ref={bodyRef}>
            {!loggedIn ? (
              <Login onAuth={() => setLoggedIn(true)} />
            ) : (
              <>
                {activeTab === 'home' && <Home onGoRun={openRun} onGoHistory={() => goTab('history')} />}
                {activeTab === 'history' && <History />}
                {activeTab === 'profile' && <Profile />}
              </>
            )}
          </div>

          {loggedIn && <TabBar active={activeTab} onChange={goTab} />}

          {loggedIn && runOpen && (
            <div className="run-overlay">
              <div className="run-overlay-top">
                <span className="label">러닝 진행</span>
                <span className="x" onClick={() => closeRun('home')}>닫기 ✕</span>
              </div>
              <div className="run-overlay-body">
                <RunScreen
                  onStart={() => goRunStep('tracking')}
                  onFinish={() => goRunStep('vitals')}
                  onGoScan={() => goRunStep('scan')}
                  onUseWatch={() => goRunStep('solution')}
                  onFinishScan={() => goRunStep('solution')}
                  onComplete={() => closeRun('history')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="foot">로그인 → 홈(러닝 시작 시 전체화면 전환) → 기록 → 프로필</div>
    </div>
  )
}
