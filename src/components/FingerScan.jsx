import { useEffect, useRef, useState } from 'react'
import RingGauge from './RingGauge.jsx'
import { getRppgGuide, startRppg, submitRppg } from '../api/endpoints.js'
import { computeBpmResult } from '../rppg.js'

const SCAN_SECONDS = 12
const SAMPLE_FPS = 20

export default function FingerScan({ run, setRun }) {
  const measuring = run.scanStage === 'measuring'
  const done = run.scanStage === 'done'
  const videoRef = useRef(null)
  const [guide, setGuide] = useState(null)

  useEffect(() => {
    getRppgGuide().then(setGuide).catch(() => {})
  }, [])

  // 안드로이드 Chrome 기준: 후면 카메라 + 플래시로 손가락 밀착 시 밝기 변화(R 채널)를 12초간 샘플링해 BPM을 계산한다.
  // 카메라 화면은 손가락으로 완전히 가려지므로 미리보기를 보여줄 필요가 없어 video 엘리먼트는 숨겨둔다.
  useEffect(() => {
    if (!measuring) return
    let cancelled = false
    let stream = null
    let sampleTimer = null
    let doneTimer = null
    const samples = []

    async function pipeline() {
      let rppgSessionId
      try {
        const started = await startRppg(run.sessionId)
        rppgSessionId = started.rppgSessionId
      } catch (err) {
        if (!cancelled) setRun((r) => ({ ...r, scanStage: 'idle', error: err.message }))
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      } catch {
        if (!cancelled) setRun((r) => ({ ...r, scanStage: 'idle', error: '카메라 접근 권한이 필요해요' }))
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const track = stream.getVideoTracks()[0]
      try {
        await track.applyConstraints({ advanced: [{ torch: true }] })
      } catch {
        // 플래시 미지원 기기(iOS Safari 등) — 손가락을 밝은 곳에 대는 것으로 대체, 측정은 계속 진행
      }

      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      setRun((r) => ({ ...r, cameraReady: true }))

      const canvas = document.createElement('canvas')
      canvas.width = 40
      canvas.height = 40
      const ctx = canvas.getContext('2d')

      sampleTimer = setInterval(() => {
        ctx.drawImage(video, 0, 0, 40, 40)
        const { data } = ctx.getImageData(0, 0, 40, 40)
        let sum = 0
        for (let i = 0; i < data.length; i += 4) sum += data[i] // R 채널
        samples.push(sum / (data.length / 4))
      }, 1000 / SAMPLE_FPS)

      doneTimer = setTimeout(async () => {
        clearInterval(sampleTimer)
        track.stop()
        stream.getTracks().forEach((t) => t.stop())
        if (cancelled) return

        const result = computeBpmResult(samples, SAMPLE_FPS)
        try {
          await submitRppg(rppgSessionId, result)
        } catch {
          // rppgSessionId는 1회용이라 재시도 불가 — 결과는 화면엔 그대로 보여주고 저장 실패만 감안
        }
        setRun((r) => ({ ...r, scanStage: 'done', scanResult: result }))
      }, (guide?.durationSec ?? SCAN_SECONDS) * 1000)
    }

    pipeline()
    return () => {
      cancelled = true
      clearInterval(sampleTimer)
      clearTimeout(doneTimer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [measuring])

  const result = run.scanResult
  const { cameraReady } = run

  return (
    <div style={{ padding: '24px 20px' }}>
      <div className="display" style={{ fontSize: 40, lineHeight: .95, whiteSpace: 'pre-line' }}>
        {done ? '측정이 끝났어요' : '카메라에\n손가락을 대주세요'}
      </div>
      <div className="body" style={{ marginTop: 10 }}>
        {done
          ? (result?.signalQuality === 'GOOD' ? '심박수를 확인했어요' : '신호가 약해요 · 다시 측정해보세요')
          : (guide?.instruction ?? '약 12초간 측정하며, 측정 중에는 손가락을 떼지 마세요')}
      </div>

      {!done && (
        <div style={{ marginTop: 20 }}>
          <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: measuring ? 'var(--ink)' : 'var(--soft-cloud)' }}>
            {/* 측정 중엔 실제 카메라 피드를 보여준다 — 손가락이 렌즈를 덮으면 화면이 어두워지는 게 정상(밀착 확인용) */}
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ display: measuring ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {/* 손가락을 올려둘 위치를 알려주는 가이드 링 */}
              <div style={{
                width: 84, height: 84, borderRadius: 'var(--radius-full)',
                border: `2px dashed ${measuring ? 'var(--canvas)' : 'var(--hairline)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: measuring ? 'var(--sale)' : 'var(--hairline)' }} />
              </div>
              {!measuring && <div className="cap" style={{ color: 'var(--mute)' }}>카메라 미리보기 · 플래시 꺼짐</div>}
            </div>

            {measuring && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '6px 12px', background: 'rgba(0,0,0,.4)' }}>
                <div className="cap" style={{ color: 'var(--canvas)' }}>
                  {cameraReady ? '카메라 · 플래시 켜짐' : '카메라 준비 중…'}
                </div>
              </div>
            )}
          </div>

          {measuring && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 4, background: 'var(--hairline-soft)' }}>
                <div style={{ width: `${Math.round((run.scanSec / SCAN_SECONDS) * 100)}%`, height: '100%', background: 'var(--ink)', transition: 'width .4s linear' }} />
              </div>
              <div className="cap-sm" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>{Math.max(0, SCAN_SECONDS - run.scanSec)}초 남음</span>
                <span>초당 {SAMPLE_FPS}프레임 수집</span>
              </div>
            </div>
          )}
        </div>
      )}

      {done && result && (
        <div style={{ marginTop: 20 }}>
          <div className="soft" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="cap-sm">측정 결과 · rPPG</div>
            <RingGauge size={160} outerPct={0.55} innerPct={0.65} value={result.avgBpm} label={`${result.avgBpm} BPM`} />
            <div className="cap" style={{ color: 'var(--charcoal)' }}>최고 {result.maxBpm} BPM</div>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            측정 시간<span className="v">12초</span>
          </div>
          <div className="row" style={{ borderTop: 'none', borderBottom: '1px solid var(--hairline-soft)' }}>
            신호 품질
            <span className={`v ${result.signalQuality === 'GOOD' ? 'ok' : 'bad'}`}>
              {result.signalQuality === 'GOOD' ? '양호 · 기록에 저장됨' : '약함 · 재측정 권장'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
