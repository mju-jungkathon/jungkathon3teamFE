import { useEffect, useState } from 'react'
import { fmtElapsed, fmtNextRunLine, saveNextRunSuggestion } from '../utils.js'
import { createRecoveryGuide, startCooldownTimer, getNextRunSuggestion } from '../api/endpoints.js'

export default function Solution({ run, setRun }) {
  const { cool, coolRunning, guide } = run
  const coolTotal = guide?.cooldownTimerSec ?? 300
  const [retryTick, setRetryTick] = useState(0)
  const [nextRun, setNextRun] = useState(null)

  // 회복 가이드가 생겨야 recoveryGuideId가 나오므로 그 이후에만 조회. 실패하면 위젯을 그냥 숨긴다.
  useEffect(() => {
    if (!guide?.recoveryGuideId) return
    getNextRunSuggestion(guide.recoveryGuideId)
      .then((s) => {
        setNextRun(s)
        saveNextRunSuggestion(s) // 홈 화면은 recoveryGuideId가 없어 여기서 저장해둔 값을 읽는다
      })
      .catch(() => {})
  }, [guide?.recoveryGuideId])

  // 5.1(idempotent) → 5.2 순서. 재진입해도 서버가 기존 가이드를 그대로 돌려줘 안전.
  // 가이드 생성이 실패하면(예: 서버 500) retryTick으로 재시도할 수 있게 열어둔다 — 실패해도 화면이 막히지 않도록.
  useEffect(() => {
    if (guide || !run.sessionId) return
    setRun((r) => ({ ...r, error: null }))
    createRecoveryGuide(run.sessionId)
      .then(async (g) => {
        setRun((r) => ({ ...r, guide: g, cool: g.cooldownTimerSec }))
        try {
          await startCooldownTimer(g.recoveryGuideId)
        } catch {
          // 타이머는 클라이언트가 로컬로 굴리므로 이 호출 실패는 무시해도 된다
        }
      })
      .catch((err) => setRun((r) => ({ ...r, error: err.message })))
  }, [retryTick])

  const toggle = () =>
    setRun((r) => (r.cool === 0 ? { ...r, cool: coolTotal, coolRunning: true } : { ...r, coolRunning: !r.coolRunning }))

  const ctaLabel = cool === 0 ? '다시 시작' : coolRunning ? '일시정지' : cool < coolTotal ? '이어서 시작' : '타이머 시작'
  const exposureMin = Math.round(run.elapsed / 60)
  const nextRunLine = nextRun && fmtNextRunLine(nextRun)

  return (
    <div>
      <div style={{ padding: '24px 20px 0' }}>
        <div className="display" style={{ fontSize: 44, lineHeight: .95 }}>오늘의<br />회복 가이드</div>
        <div className="body" style={{ marginTop: 10 }}>러닝 데이터와 심박수를 기반으로 만들었어요</div>
      </div>

      <div className="stat-grid c2" style={{ padding: '20px 20px 0' }}>
        <div className="stat bordered-b"><div className="k">평균 심박</div><div className="n hr" style={{ fontSize: 38 }}>{guide?.measuredBpm ?? run.scanResult?.avgBpm ?? '-'}</div></div>
        <div className="stat bordered-b"><div className="k">UV 노출</div><div className="n" style={{ fontSize: 38 }}>{run.prepare ? `${run.prepare.uvIndex} · ${exposureMin}분` : '-'}</div></div>
        <div className="stat"><div className="k">거리</div><div className="n" style={{ fontSize: 38 }}>{run.distanceKm.toFixed(1)}km</div></div>
        <div className="stat"><div className="k">시간</div><div className="n" style={{ fontSize: 38 }}>{exposureMin}분</div></div>
      </div>

      <div className="soft" style={{ padding: 20, marginTop: 8 }}>
        <div className="body">
          {guide?.summaryMessage ?? (run.error ? '회복 가이드를 만들지 못했어요' : '회복 가이드를 만드는 중이에요…')}
        </div>
        {!guide && run.error && (
          <button className="btn full secondary" style={{ marginTop: 14 }} onClick={() => setRetryTick((t) => t + 1)}>
            다시 시도
          </button>
        )}
      </div>

      <div className="section">
        {(guide?.actions ?? []).map((action) => (
          <div key={action.type} style={{ padding: '18px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
            <div style={{ font: 'var(--type-body-strong)' }}>{action.title}</div>
            <div className="cap" style={{ marginTop: 4 }}>{action.description}</div>
          </div>
        ))}

        {nextRunLine && (
          <div style={{ padding: '18px 0 0' }}>
            <div className="row" style={{ borderTop: 'none', paddingBottom: 0 }}>
              다음 추천 러닝일
              <span className={`v ${nextRunLine.tone}`}>{nextRunLine.text}</span>
            </div>
            {nextRunLine.caption && (
              <div className="cap-sm" style={{ marginTop: 2 }}>{nextRunLine.caption}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '26px 0 8px' }}>
          <div className="cap-sm">쿨다운 타이머</div>
          <div style={{
            width: 172, height: 172, borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `conic-gradient(var(--ink) ${(((coolTotal - cool) / coolTotal) * 360).toFixed(1)}deg, var(--hairline-soft) 0)`,
          }}>
            <div style={{ width: 148, height: 148, borderRadius: 'var(--radius-full)', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div className="display" style={{ fontSize: 46, lineHeight: 1 }}>{fmtElapsed(cool)}</div>
              <div className="cap-sm">{cool === 0 ? '완료' : coolRunning ? '진행 중' : '대기'}</div>
            </div>
          </div>
          <div style={{ width: '100%' }}>
            <button className="btn full secondary" onClick={toggle}>{ctaLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
