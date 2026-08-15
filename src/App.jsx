import { useState, useEffect } from 'react'
import Auth from './components/Auth.jsx'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import History from './components/History.jsx'
import Profile from './components/Profile.jsx'
import RunOverlay from './components/RunOverlay.jsx'
import TabBar from './components/TabBar.jsx'

export const INITIAL_RUN = {
  step: 'start',      // start | tracking | vitals | scan | solution
  elapsed: 0,
  done: [],           // 완료 표시한 스트레칭 step id
  source: null,       // watch | rppg
  scanStage: 'idle',  // idle | measuring | done
  scanSec: 0,
  cool: 300,
  coolRunning: false,
}

// 1초 틱 하나로 러닝 경과·rPPG 측정·쿨다운 타이머를 모두 굴린다.
function tick(r, overlayOpen) {
  if (r.step === 'tracking' && overlayOpen) return { ...r, elapsed: r.elapsed + 1 }
  if (r.step === 'scan' && r.scanStage === 'measuring') {
    return r.scanSec >= 11 ? { ...r, scanSec: 12, scanStage: 'done' } : { ...r, scanSec: r.scanSec + 1 }
  }
  if (r.step === 'solution' && r.coolRunning) {
    return r.cool <= 1 ? { ...r, cool: 0, coolRunning: false } : { ...r, cool: r.cool - 1 }
  }
  return r
}

export default function App() {
  const [user, setUser] = useState(null)        // { nickname, email } · null이면 미로그인
  const [pending, setPending] = useState(null)  // 회원가입 직후 온보딩 대기 중인 가입 정보
  const [goal, setGoal] = useState({ type: '체력 증진', freq: 5 })
  const [tab, setTab] = useState('home')
  const [overlay, setOverlay] = useState(false)
  const [run, setRun] = useState(INITIAL_RUN)

  useEffect(() => {
    const id = setInterval(() => setRun((r) => tick(r, overlay)), 1000)
    return () => clearInterval(id)
  }, [overlay])

  const finishRun = () => {
    setRun(INITIAL_RUN)
    setOverlay(false)
    setTab('history')
  }

  const logout = () => {
    setUser(null)
    setPending(null)
    setTab('home')
    setOverlay(false)
    setRun(INITIAL_RUN)
  }

  const screen = () => {
    if (pending) {
      return (
        <Onboarding
          nickname={pending.nickname}
          onDone={(type, freq) => {
            setGoal({ type, freq })
            setUser(pending)
            setPending(null)
          }}
        />
      )
    }
    if (!user) {
      return <Auth onLogin={setUser} onSignup={setPending} />
    }
    return (
      <>
        {tab === 'home' && (
          <Home goal={goal} run={run} onStartRun={() => setOverlay(true)} onGoHistory={() => setTab('history')} />
        )}
        {tab === 'history' && <History />}
        {tab === 'profile' && <Profile user={user} goal={goal} onSaveGoal={setGoal} onLogout={logout} />}

        <TabBar active={tab} onChange={setTab} />

        {overlay && (
          <RunOverlay
            run={run}
            setRun={setRun}
            onClose={() => setOverlay(false)}
            onComplete={finishRun}
          />
        )}
      </>
    )
  }

  return (
    <div className="stage">
      <div className="lead">
        <div className="eyebrow">AFTERGROW PROTOTYPE</div>
        <h1>러닝 후, 회복까지</h1>
        <p>로그인 → 홈 → 러닝(전체화면) → 기록 → 프로필. 팝업·타이머 전부 동작합니다.</p>
      </div>

      <div className="device">
        <div className="screen">{screen()}</div>
      </div>

      <div className="foot">데스크톱에서는 폰 목업으로, 실제 모바일에서는 화면 전체로 표시됩니다.</div>
    </div>
  )
}
