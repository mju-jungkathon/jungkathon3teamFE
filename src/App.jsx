import { useState, useEffect, useRef } from 'react'
import Auth from './components/Auth.jsx'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import History from './components/History.jsx'
import Profile from './components/Profile.jsx'
import RunOverlay from './components/RunOverlay.jsx'
import TabBar from './components/TabBar.jsx'
import { getPrepare, getLive } from './api/endpoints.js'
import { haversineKm, intensityFromPace } from './utils.js'
import { reverseGeocode } from './kakao.js'

export const INITIAL_RUN = {
  step: 'start',      // start | tracking | vitals | scan | solution
  elapsed: 0,
  done: [],           // 완료 표시한 스트레칭 step id
  source: null,       // watch | rppg
  scanStage: 'idle',  // idle | measuring | done
  scanSec: 0,
  cameraReady: false, // getUserMedia + video.play()까지 끝나야 true (그 전엔 카운트다운 멈춰있음)
  scanResult: null,   // { avgBpm, maxBpm, hrvMs, signalQuality }
  cool: 300,
  coolRunning: false,
  lat: null,
  lng: null,
  prepare: null,      // GET /running-sessions/prepare 응답
  locationLabel: null, // 카카오 역지오코딩 결과("서울특별시 서대문구") — 백엔드는 이 값을 안 줘서 프론트에서 직접 구한다
  sessionId: null,
  distanceKm: 0,
  route: [],          // tracking 중 수집한 실제 GPS 포인트 { lat, lng }[] — 지도 드로잉용
  intensity: 'MODERATE',
  starting: false,    // 러닝 시작 API 호출 중
  ending: false,      // 러닝 종료 API 호출 중
  completing: false,  // 세션 완료 API 호출 중
  guide: null,        // POST .../recovery-guide 응답
  error: null,
}

// 1초 틱 하나로 러닝 경과·rPPG 측정·쿨다운 타이머를 모두 굴린다.
function tick(r, overlayOpen) {
  if (r.step === 'tracking' && overlayOpen) return { ...r, elapsed: r.elapsed + 1 }
  // scanStage: 'done'으로의 전환은 FingerScan의 실제 측정 파이프라인이 끝났을 때 일어난다(여기선 진행률 표시용 초만 증가).
  // cameraReady 전(카메라 권한·플래시 준비 중)에는 카운트다운을 멈춰 실제 측정 시작 시점과 화면을 맞춘다.
  if (r.step === 'scan' && r.scanStage === 'measuring' && r.cameraReady) {
    return { ...r, scanSec: Math.min(12, r.scanSec + 1) }
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

  // GPS 위치 추적: 오버레이가 열리면 구독 시작, prepare는 첫 좌표를 받는 즉시 1회 호출.
  // tracking 단계에서만 거리를 누적한다(준비 화면에서 서성이는 동안은 누적 안 함).
  useEffect(() => {
    if (!overlay) return
    if (!navigator.geolocation) {
      setRun((r) => ({ ...r, error: '이 브라우저/환경에서는 위치 정보를 쓸 수 없어요 (HTTPS 또는 localhost 필요)' }))
      return
    }
    let prepared = false
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setRun((r) => {
          const distanceKm =
            r.step === 'tracking' && r.lat != null
              ? r.distanceKm + haversineKm(r.lat, r.lng, lat, lng)
              : r.distanceKm
          const route = r.step === 'tracking' ? [...r.route, { lat, lng }] : r.route
          return { ...r, lat, lng, distanceKm, route }
        })
        if (!prepared) {
          prepared = true
          getPrepare(lat, lng)
            .then((prepare) => setRun((r) => ({ ...r, prepare })))
            .catch((err) => setRun((r) => ({ ...r, error: err.message })))
          reverseGeocode(lat, lng)
            .then((locationLabel) => locationLabel && setRun((r) => ({ ...r, locationLabel })))
            .catch(() => {}) // 실패해도 '위치 확인 중…' 폴백으로 충분
        }
      },
      (err) =>
        setRun((r) => ({
          ...r,
          error: err.code === err.TIMEOUT
            ? '위치를 찾는 데 시간이 오래 걸려요. 기기의 위치 서비스(GPS)가 켜져 있는지 확인해주세요'
            : '위치 권한이 필요해요',
        })),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [overlay])

  // 러닝 진행 중 서버 스냅샷 동기화(5초 간격). ref로 최신 run을 읽어 인터벌을 매초 재구독하지 않는다.
  const runRef = useRef(run)
  runRef.current = run
  useEffect(() => {
    if (!overlay) return
    const id = setInterval(() => {
      const r = runRef.current
      if (r.step !== 'tracking' || !r.sessionId) return
      const intensity = intensityFromPace(r.distanceKm > 0 ? r.elapsed / r.distanceKm : null)
      setRun((cur) => ({ ...cur, intensity }))
      getLive(r.sessionId, r.distanceKm, intensity).catch(() => {})
    }, 5000)
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
