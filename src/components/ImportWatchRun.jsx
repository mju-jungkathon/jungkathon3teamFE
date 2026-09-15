import { useEffect, useState } from 'react'
import { ChevronRight } from '../constants/Icons.jsx'
import { GREEN_900, GRAY_300, RED_400, GREEN_50 } from '../constants/colors.ts'
import { fmtTodayLabel, fmtClock, fmtDurationKor } from '../utils.js'
import { getRunningSessions } from '../api/endpoints.js'
import { queryRecentRunningWorkouts } from '../health.js'
import { importWatchWorkout } from '../importRun.js'

const IMPORT_WINDOW_DAYS = 7
const DUP_WINDOW_MS = 2 * 60 * 1000 // §7: startedAt이 ±2분 이내면 이미 등록된 것으로 간주

function isDuplicate(workout, existingSessions) {
  const t = new Date(workout.startedAt).getTime()
  return existingSessions.some((s) => Math.abs(new Date(s.startedAt).getTime() - t) <= DUP_WINDOW_MS)
}

export default function ImportWatchRun({ onImported }) {
  // loading | ready | empty | error
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [workouts, setWorkouts] = useState([])
  const [existing, setExisting] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      // 중복 판정(§7)은 서버 데이터 기준 — 기기를 바꾸거나 앱을 지워도 유지된다.
      getRunningSessions('30d').catch(() => ({ records: [] })),
      queryRecentRunningWorkouts(IMPORT_WINDOW_DAYS),
    ])
      .then(([sessions, list]) => {
        if (cancelled) return
        setExisting(sessions.records || [])
        setWorkouts(list)
        setState(list.length ? 'ready' : 'empty')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || '워크아웃을 불러오지 못했어요')
        setState('error')
      })
    return () => { cancelled = true }
  }, [])

  const selected = workouts.find((w) => w.workoutId === selectedId)

  const register = async () => {
    if (!selected) return
    setRegistering(true)
    setRegisterError('')
    try {
      // 좌표·UV 계산은 importRun.js(createAndEndSession)가 공용으로 처리한다 — 여기서 만들지 않는다.
      await importWatchWorkout({ workout: selected })
      onImported(selected.startedAt)
    } catch (err) {
      setRegisterError(err.message || '등록하지 못했어요. 잠시 후 다시 시도해주세요')
      setRegistering(false)
    }
  }

  if (state === 'loading') {
    return <div className="cap-sm" style={{ padding: '44px 20px', textAlign: 'center' }}>워크아웃을 불러오는 중…</div>
  }

  if (state === 'error') {
    return (
      <div style={{ padding: '44px 20px', textAlign: 'center' }}>
        <div className="body" style={{ color: RED_400 }}>{error}</div>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div style={{ padding: '44px 20px', textAlign: 'center' }}>
        <div className="h-lg">최근 {IMPORT_WINDOW_DAYS}일 안에 워치 러닝 기록이 없어요</div>
        <div className="body" style={{ color: GRAY_300, marginTop: 8 }}>
          건강 앱에 러닝 워크아웃이 기록돼 있는지 확인해주세요
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ animation: 'agRise .3s ease both' }}>
        {workouts.map((w) => {
          const dup = isDuplicate(w, existing)
          const on = selectedId === w.workoutId
          return (
            <button
              key={w.workoutId}
              className="press"
              disabled={dup}
              onClick={() => setSelectedId(w.workoutId)}
              style={{
                width: '100%', textAlign: 'left', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                gap: 12, padding: '16px 20px', border: 'none',
                borderTop: '1px solid var(--hairline)',
                background: on ? GREEN_50 : 'none',
                opacity: dup ? .4 : 1,
                cursor: dup ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div>
                <div style={{ font: 'var(--type-body-strong)', color: GREEN_900 }}>
                  {fmtTodayLabel(new Date(w.startedAt))} · {fmtClock(w.startedAt)}
                </div>
                <div className="cap-sm" style={{ marginTop: 4, color: GRAY_300 }}>
                  {w.distanceKm.toFixed(2)}km · {fmtDurationKor(w.durationSec)}
                  {w.avgBpm != null ? ` · ${w.avgBpm}BPM` : ''}
                </div>
              </div>
              {dup ? (
                <span className="badge">등록됨</span>
              ) : (
                <ChevronRight size={18} style={{ color: GRAY_300, flex: 'none' }} />
              )}
            </button>
          )
        })}
      </div>

      {registerError && (
        <div className="cap" style={{ padding: '10px 20px', color: RED_400 }}>{registerError}</div>
      )}

      <div style={{ padding: 20 }}>
        <button
          className="btn lg full"
          disabled={!selected || registering}
          onClick={register}
        >
          {registering ? '등록하는 중…' : '선택한 러닝 등록하기'}
        </button>
      </div>
    </>
  )
}
