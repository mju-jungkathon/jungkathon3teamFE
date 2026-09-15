import { useEffect, useState } from 'react'
import FingerScan from './FingerScan.jsx'
import { GRAY_300, RED_400 } from '../constants/colors.ts'
import { heartRateTrustLevel } from '../utils.js'
import { localDateTime } from '../api/client.js'
import { createManualSession, selectRppgForSession, finishImportSession } from '../importRun.js'

const INTENSITY_OPTIONS = [
  ['LOW', '낮음'],
  ['MODERATE', '보통'],
  ['HIGH', '높음'],
]

const todayStr = () => localDateTime(new Date()).slice(0, 10)
const nowTimeStr = () => localDateTime(new Date()).slice(11, 16)

const SCAN_IDLE = { scanStage: 'idle', scanSec: 0, cameraReady: false, torchOn: null, scanResult: null, error: null }

export default function ManualRunForm({ onImported }) {
  // form | measure-prompt | scan
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ date: todayStr(), time: nowTimeStr(), distanceKm: '', durationMin: '', durationSec: '', intensity: 'MODERATE' })
  const [formErr, setFormErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [session, setSession] = useState(null) // { sessionId, endedAtIso }
  const [scan, setScan] = useState(SCAN_IDLE)
  const [finishing, setFinishing] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // scan 단계 진행 중일 때만 1초마다 scanSec 증가 — App.jsx의 러닝 오버레이 tick() 중
  // 'scan' 분기를 그대로 복제한 것이다(FingerScan.jsx는 부모가 이걸 굴려준다는 전제로 만들어짐).
  useEffect(() => {
    if (step !== 'scan') return
    const id = setInterval(() => {
      setScan((s) => (s.scanStage === 'measuring' && s.cameraReady ? { ...s, scanSec: Math.min(12, s.scanSec + 1) } : s))
    }, 1000)
    return () => clearInterval(id)
  }, [step])

  const submit = async (e) => {
    e.preventDefault()
    const distanceKm = parseFloat(form.distanceKm)
    const durationSec = (parseInt(form.durationMin || '0', 10) * 60) + parseInt(form.durationSec || '0', 10)
    if (!distanceKm || distanceKm <= 0) return setFormErr('거리를 입력해주세요')
    if (!durationSec || durationSec <= 0) return setFormErr('소요 시간을 입력해주세요')

    const startedAtDate = new Date(`${form.date}T${form.time}:00`)
    if (Number.isNaN(startedAtDate.getTime())) return setFormErr('날짜와 시각을 확인해주세요')
    if (startedAtDate.getTime() > Date.now()) return setFormErr('미래 시각은 입력할 수 없어요')

    const endedAtDate = new Date(startedAtDate.getTime() + durationSec * 1000)

    setFormErr('')
    setSubmitting(true)
    try {
      const sessionId = await createManualSession({
        startedAt: localDateTime(startedAtDate),
        endedAt: localDateTime(endedAtDate),
        durationSec,
        distanceKm,
        intensity: form.intensity,
      })
      setSession({ sessionId, endedAtIso: endedAtDate.toISOString(), startedAtIso: startedAtDate.toISOString() })
      setStep('measure-prompt')
    } catch (err) {
      setFormErr(err.message || '기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요')
    } finally {
      setSubmitting(false)
    }
  }

  const finishAndClose = async () => {
    setFinishing(true)
    await finishImportSession(session.sessionId)
    onImported(session.startedAtIso)
  }

  const startMeasuring = () => {
    selectRppgForSession(session.sessionId)
    // FingerScan.jsx는 run.sessionId로 rPPG 시작(startRppg)을 호출한다 — 반드시 같이 넘긴다.
    setScan({ ...SCAN_IDLE, sessionId: session.sessionId })
    setStep('scan')
  }

  if (step === 'form') {
    return (
      <form onSubmit={submit} style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ar-date">날짜</label>
              <input id="ar-date" type="date" value={form.date} max={todayStr()} onChange={set('date')} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ar-time">시작 시각</label>
              <input id="ar-time" type="time" value={form.time} onChange={set('time')} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="ar-distance">거리 (km)</label>
            <input id="ar-distance" type="number" inputMode="decimal" step="0.01" min="0" placeholder="예: 4.8" value={form.distanceKm} onChange={set('distanceKm')} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ar-min">소요 시간 · 분</label>
              <input id="ar-min" type="number" inputMode="numeric" min="0" placeholder="24" value={form.durationMin} onChange={set('durationMin')} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ar-sec">초</label>
              <input id="ar-sec" type="number" inputMode="numeric" min="0" max="59" placeholder="12" value={form.durationSec} onChange={set('durationSec')} />
            </div>
          </div>

          <div className="field">
            <label>강도</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {INTENSITY_OPTIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`pick ${form.intensity === value ? 'on' : ''}`}
                  style={{ padding: '12px 8px', textAlign: 'center' }}
                  onClick={() => setForm((f) => ({ ...f, intensity: value }))}
                >
                  <span className="pt">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {formErr && <div className="err">{formErr}</div>}
        </div>

        <button className="btn lg full" type="submit" disabled={submitting} style={{ marginTop: 22 }}>
          {submitting ? '등록하는 중…' : '등록'}
        </button>
      </form>
    )
  }

  if (step === 'measure-prompt') {
    const trust = heartRateTrustLevel(session.endedAtIso)
    const measurePrimary = trust !== 'expired'
    return (
      <div style={{ padding: '24px 20px' }}>
        <div className="display" style={{ fontSize: 40, lineHeight: .95 }}>지금 심박수를<br />측정할까요</div>

        {trust !== 'fresh' && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {trust === 'stale' && <span className="badge">참고용</span>}
            <span className="cap-sm" style={{ color: GRAY_300 }}>
              {trust === 'stale'
                ? '러닝 직후가 아니라 회복 심박수로는 정확하지 않아요'
                : '측정 시각이 너무 지나서 회복 심박수로 보기 어려워요'}
            </span>
          </div>
        )}

        <div className="body" style={{ marginTop: trust === 'fresh' ? 10 : 16, color: GRAY_300 }}>
          건너뛰어도 기록은 그대로 저장돼요
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <button className={`btn lg full ${measurePrimary ? '' : 'secondary'}`} disabled={finishing} onClick={startMeasuring}>
            측정하기
          </button>
          <button className={`btn lg full ${measurePrimary ? 'secondary' : ''}`} disabled={finishing} onClick={finishAndClose}>
            {finishing ? '저장하는 중…' : '건너뛰기'}
          </button>
        </div>
      </div>
    )
  }

  // step === 'scan'
  const idle = scan.scanStage === 'idle'
  const measuring = scan.scanStage === 'measuring'
  const done = scan.scanStage === 'done'

  return (
    <>
      {scan.error && (
        <div className="cap" style={{ padding: '10px 20px', color: RED_400 }}>{scan.error}</div>
      )}

      <FingerScan run={scan} setRun={setScan} />

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {done && (
          <button className="btn lg full secondary" onClick={() => setScan((s) => ({ ...SCAN_IDLE, sessionId: s.sessionId }))}>재측정하기</button>
        )}
        <button
          className="btn lg full"
          disabled={measuring || finishing}
          onClick={
            idle
              ? () => setScan((s) => ({ ...s, scanStage: 'measuring', scanSec: 0, cameraReady: false, error: null }))
              : finishAndClose
          }
        >
          {idle ? '측정 시작' : measuring ? '측정 중 · 거리를 유지해주세요' : finishing ? '저장하는 중…' : '완료'}
        </button>
      </div>
    </>
  )
}
