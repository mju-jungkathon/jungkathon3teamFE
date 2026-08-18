import { useState, useEffect, useRef } from 'react'
import Auth from './components/Auth.jsx'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import History from './components/History.jsx'
import Profile from './components/Profile.jsx'
import RunOverlay from './components/RunOverlay.jsx'
import TabBar from './components/TabBar.jsx'
import { logout as logoutApi, getPrepare, getLive, getUvForecast, getProfile } from './api/endpoints.js'
import { getTokens, setTokens } from './api/client.js'
import { haversineKm, intensityFromPace, currentHourBucket, uvBand } from './utils.js'
import { reverseGeocode } from './kakao.js'

export const INITIAL_RUN = {
  step: 'start',      // start | tracking | vitals | scan | solution
  elapsed: 0,
  done: [],           // 완료 표시한 스트레칭 step id
  source: null,       // watch | rppg
  scanStage: 'idle',  // idle | measuring | done
  scanSec: 0,
  cameraReady: false, // getUserMedia + video.play()까지 끝나야 true
  scanResult: null,   // { avgBpm, maxBpm, hrvMs, signalQuality }
  cool: 300,
  coolRunning: false,
  lat: null,
  lng: null,
  prepare: null,      // GET /running-sessions/prepare 응답
  locationLabel: null,// 카카오 역지오코딩 결과
  sessionId: null,
  distanceKm: 0,
  route: [],          // tracking 중 수집한 실제 GPS 포인트
  intensity: 'MODERATE',
  starting: false,    // 러닝 시작 API 호출 중
  ending: false,      // 러닝 종료 API 호출 중
  completing: false,  // 세션 완료 API 호출 중
  guide: null,        // POST .../recovery-guide 응답
  error: null,
}

// 1초 틱 타이머 (러닝 경과·rPPG 측정·쿨다운)
function tick(r, overlayOpen) {
  if (r.step === 'tracking' && overlayOpen) return { ...r, elapsed: r.elapsed + 1 }
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

  // 1. 앱 접속/새로고침 시 저장된 토큰으로 자동 로그인 처리
  useEffect(() => {
    const token = getTokens()?.accessToken
    if (token) {
      getProfile()
        .then((userData) => {
          if (userData) setUser(userData)
        })
        .catch(() => {
          // 토큰 만료 또는 유효하지 않을 경우 로컬 스토리지 정리
          setTokens(null)
        })
    }
  }, [])

  // 2. 타이머 인터벌
  useEffect(() => {
    const id = setInterval(() => setRun((r) => tick(r, overlay)), 1000)
    return () => clearInterval(id)
  }, [overlay])

  // 3. GPS 위치 추적 & Weather/Prepare 데이터 수집
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
          const route = r.step === 'tracking' ? [...r.route, { lat, lng, t: r.elapsed }] : r.route
          return { ...r, lat, lng, distanceKm, route }
        })
        if (!prepared) {
          prepared = true
          let uvOverride = null
          getUvForecast(lat, lng)
            .then((d) => {
              const bucket = currentHourBucket(d.hourly)
              if (!bucket) return
              uvOverride = { uvIndex: bucket.uv, uvLevel: uvBand(bucket.uv), goodTimeToRun: bucket.uv < 7 }
              setRun((r) => (r.prepare ? { ...r, prepare: { ...r.prepare, ...uvOverride } } : r))
            })
            .catch(() => {})
          getPrepare(lat, lng)
            .then((prepare) => setRun((r) => ({ ...r, prepare: uvOverride ? { ...prepare, ...uvOverride } : prepare })))
            .catch((err) => setRun((r) => ({ ...r, error: err.message })))
          reverseGeocode(lat, lng)
            .then((locationLabel) => locationLabel && setRun((r) => ({ ...r, locationLabel })))
            .catch(() => {})
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

  // 4. 러닝 실시간 스냅샷 동기화 (5초 간격)
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

  // 5. 로그아웃 (서버 처리 및 로컬 토큰 완전 삭제)
  const logout = () => {
    logoutApi().catch(() => {}) // 실패해도 로컬 토큰은 logoutApi 내부에서 이미 지워짐
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

      <div className="foot">데스크톱에서는 폰 목업으로, 실제 모바일에서는 화면 전체로 표시됩니다</div>
    </div>
  )
}