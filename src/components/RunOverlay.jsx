import { useState } from 'react'
import Sheet from './Sheet.jsx'
import RunStart from './RunStart.jsx'
import Tracking from './Tracking.jsx'
import Vitals from './Vitals.jsx'
import FingerScan from './FingerScan.jsx'
import Solution from './Solution.jsx'
import { XIcon } from './Icons.jsx'
import { ROUTINE } from '../data.js'
import { startRunning, endRunning, completeRunning, listRunningSessions } from '../api/endpoints.js'

const STEP_LABEL = {
  start: '러닝 준비', tracking: '러닝 진행 중', vitals: '심박수 확인',
  scan: '손가락 측정', solution: '회복 가이드',
}

const STEPS = { start: RunStart, tracking: Tracking, vitals: Vitals, scan: FingerScan, solution: Solution }

// 정상 종료 못 하고 남은 IN_PROGRESS 세션(E4090 원인)을 찾아 강제 종료한다.
// 좀비 세션이라 트래킹 데이터가 없으니 거리 0으로 형식만 맞춰 닫는다.
async function closeStaleSession() {
  const { records } = await listRunningSessions()
  const stale = records.find((r) => r.status === 'IN_PROGRESS')
  if (!stale) throw new Error('진행 중인 러닝을 찾지 못했어요')
  const durationSec = Math.max(1, Math.round((Date.now() - new Date(stale.startedAt).getTime()) / 1000))
  await endRunning(stale.runningSessionId, { durationSec, distanceKm: 0, intensity: 'LOW' })
}

// 단계별 하단 CTA. 라벨·비활성 여부·다음 단계가 전부 여기 모여 있다.
function cta(run, setRun, onComplete) {
  switch (run.step) {
    case 'start':
      if (run.starting) return { label: '시작하는 중…', disabled: true, go: () => {} }
      // prepare(uvIndex)가 아직 안 왔는데 시작하면 uvIndexAtStart가 비어서 전송된다 —
      // 이 값이 없으면 회복 가이드 생성(UV 노출량 계산)에서 서버가 500을 낸다.
      return {
        label: run.lat == null ? '위치 확인 중…' : run.prepare == null ? 'UV 지수 확인 중…' : '러닝 시작하기',
        disabled: run.lat == null || run.prepare == null,
        go: async () => {
          setRun((r) => ({ ...r, starting: true, error: null }))
          try {
            const session = await startRunning(run.lat, run.lng, run.prepare?.uvIndex)
            // 지도가 다음 GPS 갱신을 기다리지 않고 바로 뜨도록 시작 시점의 좌표를 route 첫 점으로 심어둔다 —
            // 실내·랩탑처럼 GPS 갱신이 뜸한 환경에서는 다음 fix가 한참 안 와 지도가 계속 '위치 수집 중…'에 멈춰 있었다.
            setRun((r) => ({
              ...r,
              step: 'tracking',
              elapsed: 0,
              sessionId: session.runningSessionId,
              starting: false,
              route: r.lat != null ? [{ lat: r.lat, lng: r.lng }] : r.route,
            }))
          } catch (err) {
            if (err.code !== 'E4090') {
              setRun((r) => ({ ...r, starting: false, error: err.message }))
              return
            }
            // 이전에 종료 못 한 세션이 남아 새 러닝을 막고 있는 경우 — 찾아서 닫고 한 번 더 시도
            try {
              await closeStaleSession()
              const session = await startRunning(run.lat, run.lng, run.prepare?.uvIndex)
              setRun((r) => ({
                ...r,
                step: 'tracking',
                elapsed: 0,
                sessionId: session.runningSessionId,
                starting: false,
                route: r.lat != null ? [{ lat: r.lat, lng: r.lng }] : r.route,
              }))
            } catch {
              setRun((r) => ({ ...r, starting: false, error: '이전 러닝을 정리하지 못했어요. 잠시 후 다시 시도해주세요' }))
            }
          }
        },
      }
    case 'tracking':
      if (run.ending) return { label: '종료하는 중…', disabled: true, go: () => {} }
      return {
        label: '러닝 종료',
        go: async () => {
          setRun((r) => ({ ...r, ending: true, error: null }))
          try {
            await endRunning(run.sessionId, { durationSec: run.elapsed, distanceKm: run.distanceKm, intensity: run.intensity })
            setRun((r) => ({ ...r, step: 'vitals', ending: false }))
          } catch (err) {
            setRun((r) => ({ ...r, ending: false, error: err.message }))
          }
        },
      }
    case 'vitals':
      if (run.source === 'watch') return { label: '이 데이터로 솔루션 받기', go: () => setRun((r) => ({ ...r, step: 'solution' })) }
      if (run.source === 'rppg') return { label: '측정 화면으로 이동', go: () => setRun((r) => ({ ...r, step: 'scan', scanStage: 'idle', scanSec: 0 })) }
      return { label: '측정 방식을 선택해주세요', disabled: true, go: () => {} }
    case 'scan':
      if (run.scanStage === 'idle') return { label: '측정 시작', go: () => setRun((r) => ({ ...r, scanStage: 'measuring', scanSec: 0, cameraReady: false, error: null })) }
      if (run.scanStage === 'measuring') return { label: '측정 중 · 손가락을 떼지 마세요', disabled: true, go: () => {} }
      // CLAUDE.md: signalQuality:'POOR'는 에러가 아니라 재측정 유도 UI로 분기 — 결과가 좋아도 재측정은 항상 선택 가능하게 둔다.
      return {
        label: '솔루션 확인하기',
        go: () => setRun((r) => ({ ...r, step: 'solution' })),
        secondary: {
          label: '재측정하기',
          go: () => setRun((r) => ({ ...r, scanStage: 'idle', scanSec: 0, scanResult: null })),
        },
      }
    default:
      if (run.completing) return { label: '완료하는 중…', disabled: true, go: () => {} }
      // 회복 가이드(5.1)가 먼저 생성돼 있어야 완료(5.3)가 404 없이 성공한다 — 가이드 로딩 전엔 막는다.
      if (!run.guide) return { label: '회복 가이드 준비 중…', disabled: true, go: () => {} }
      return {
        label: '완료하고 기록 보기',
        go: async () => {
          setRun((r) => ({ ...r, completing: true, error: null }))
          try {
            await completeRunning(run.sessionId)
            onComplete()
          } catch (err) {
            setRun((r) => ({ ...r, completing: false, error: err.message }))
          }
        },
      }
  }
}

export default function RunOverlay({ run, setRun, onClose, onComplete }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const Step = STEPS[run.step]
  const action = cta(run, setRun, onComplete)
  const allDone = run.done.length === ROUTINE.length

  const toggleStep = (id) =>
    setRun((r) => ({ ...r, done: r.done.includes(id) ? r.done.filter((x) => x !== id) : [...r.done, id] }))

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--canvas)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="hdr">
        <span className="wordmark" style={{ fontSize: 22 }}>{STEP_LABEL[run.step]}</span>
        <button className="icon-btn" onClick={onClose} aria-label="닫기"><XIcon size={18} /></button>
      </div>

      {run.error && (
        <div className="cap" style={{ padding: '10px 20px', color: 'var(--sale)', borderBottom: '1px solid var(--hairline-soft)' }}>
          {run.error}
        </div>
      )}

      <div className="scroll" style={{ paddingBottom: 110 }}>
        <Step run={run} setRun={setRun} onOpenSheet={() => setSheetOpen(true)} />
      </div>

      <div className="cta-dock at-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {action.secondary && (
          <button className="btn lg full secondary" onClick={action.secondary.go}>{action.secondary.label}</button>
        )}
        <button className="btn lg full" disabled={action.disabled} onClick={action.go}>{action.label}</button>
      </div>

      {sheetOpen && (
        <Sheet label="출발 전 3분 루틴" onClose={() => setSheetOpen(false)}>
          {(close) => (
            <>
              <div className="sheet-title">출발 전 3분 루틴</div>
              <div className="cap" style={{ marginTop: 8 }}>항목을 눌러 완료 표시를 해보세요</div>
              <div style={{ marginTop: 12 }}>
                {ROUTINE.map((step, i) => {
                  const isDone = run.done.includes(step.id)
                  return (
                    <button
                      key={step.id}
                      className="press"
                      onClick={() => toggleStep(step.id)}
                      style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', padding: '16px 0', border: 'none', borderTop: '1px solid var(--hairline-soft)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <span style={{
                        flex: 'none', width: 30, height: 30, borderRadius: 'var(--radius-full)',
                        font: 'var(--type-caption-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? 'var(--ink)' : 'var(--soft-cloud)',
                        color: isDone ? 'var(--canvas)' : 'var(--charcoal)',
                      }}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', font: 'var(--type-body-strong)' }}>{step.title}</span>
                        <span className="cap" style={{ display: 'block', marginTop: 2 }}>{step.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: 22 }}>
                <button className="btn lg full" onClick={close}>{allDone ? '완료하고 닫기' : '나중에 하고 닫기'}</button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </div>
  )
}
