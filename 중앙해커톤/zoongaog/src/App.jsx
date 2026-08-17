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

  const logout = () => {
    setLoggedIn(false)
    setActiveTab('home')
    setRunOpen(false)
  }

  const RunScreen = RUN_STEPS[runStep]

  return (
    <div className="stage">
      <div className="lead">
        <div className="eyebrow">AURA Prototype</div>
        <h1>러닝 중 심박수를 재고, 회복을 처방받다</h1>
        <p>로그인 → 홈 → 러닝(전체화면) → 기록 → 프로필. Claude 디자인 시스템 적용, 클릭형 팝업 전부 동작합니다.</p>
      </div>

      <div className="device">
        <div className="screen">
          <div className="statusbar">
            <span>9:41</span>
            <span>AURA</span>
          </div>

          <div className="body" ref={bodyRef}>
            {!loggedIn ? (
              <Login onAuth={() => setLoggedIn(true)} />
            ) : (
              <>
                {activeTab === 'home' && <Home onGoRun={openRun} onGoHistory={() => goTab('history')} />}
                {activeTab === 'history' && <History />}
                {activeTab === 'profile' && <Profile onLogout={logout} />}
              </>
            )}
          </div>

          {loggedIn && <TabBar active={activeTab} onChange={goTab} />}

          {loggedIn && runOpen && (
            <div className="run-overlay">
              <div className="run-overlay-top">
                <span className="label">러닝 진행</span>
                <button className="icon-btn" onClick={() => closeRun('home')} aria-label="닫기">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
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