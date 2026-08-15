import { useState } from 'react'
import Sheet from './Sheet.jsx'
import RunStart from './RunStart.jsx'
import Tracking from './Tracking.jsx'
import Vitals from './Vitals.jsx'
import FingerScan from './FingerScan.jsx'
import Solution from './Solution.jsx'
import { XIcon } from './Icons.jsx'
import { ROUTINE } from '../data.js'

const STEP_LABEL = {
  start: '러닝 준비', tracking: '러닝 진행 중', vitals: '심박수 확인',
  scan: '손가락 측정', solution: '회복 가이드',
}

const STEPS = { start: RunStart, tracking: Tracking, vitals: Vitals, scan: FingerScan, solution: Solution }

// 단계별 하단 CTA. 라벨·비활성 여부·다음 단계가 전부 여기 모여 있다.
function cta(run, setRun, onComplete) {
  switch (run.step) {
    case 'start':
      return { label: '러닝 시작하기', go: () => setRun((r) => ({ ...r, step: 'tracking', elapsed: 0 })) }
    case 'tracking':
      return { label: '러닝 종료', go: () => setRun((r) => ({ ...r, step: 'vitals' })) }
    case 'vitals':
      if (run.source === 'watch') return { label: '이 데이터로 솔루션 받기', go: () => setRun((r) => ({ ...r, step: 'solution' })) }
      if (run.source === 'rppg') return { label: '측정 화면으로 이동', go: () => setRun((r) => ({ ...r, step: 'scan', scanStage: 'idle', scanSec: 0 })) }
      return { label: '측정 방식을 선택해주세요', disabled: true, go: () => {} }
    case 'scan':
      if (run.scanStage === 'idle') return { label: '측정 시작', go: () => setRun((r) => ({ ...r, scanStage: 'measuring', scanSec: 0 })) }
      if (run.scanStage === 'measuring') return { label: '측정 중 · 손가락을 떼지 마세요', disabled: true, go: () => {} }
      return { label: '솔루션 확인하기', go: () => setRun((r) => ({ ...r, step: 'solution' })) }
    default:
      return { label: '완료하고 기록 보기', go: onComplete }
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

      <div className="scroll" style={{ paddingBottom: 110 }}>
        <Step run={run} setRun={setRun} onOpenSheet={() => setSheetOpen(true)} />
      </div>

      <div className="cta-dock at-bottom">
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
