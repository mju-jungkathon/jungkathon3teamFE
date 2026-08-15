import { fmtElapsed } from '../utils.js'

const COOL_TOTAL = 300

export default function Solution({ run, setRun }) {
  const { cool, coolRunning } = run
  const toggle = () =>
    setRun((r) => (r.cool === 0 ? { ...r, cool: COOL_TOTAL, coolRunning: true } : { ...r, coolRunning: !r.coolRunning }))

  const ctaLabel = cool === 0 ? '다시 시작' : coolRunning ? '일시정지' : cool < COOL_TOTAL ? '이어서 시작' : '타이머 시작'

  return (
    <div>
      <div style={{ padding: '24px 20px 0' }}>
        <div className="display" style={{ fontSize: 44, lineHeight: .95 }}>오늘의<br />회복 가이드</div>
        <div className="body" style={{ marginTop: 10 }}>러닝 데이터와 심박수를 기반으로 만들었어요</div>
      </div>

      <div className="stat-grid c2" style={{ padding: '20px 20px 0' }}>
        <div className="stat bordered-b"><div className="k">평균 심박</div><div className="n hr" style={{ fontSize: 38 }}>146</div></div>
        <div className="stat bordered-b"><div className="k">UV 노출</div><div className="n" style={{ fontSize: 38 }}>6 · 38분</div></div>
        <div className="stat"><div className="k">거리</div><div className="n" style={{ fontSize: 38 }}>4.8km</div></div>
        <div className="stat"><div className="k">시간</div><div className="n" style={{ fontSize: 38 }}>28분</div></div>
      </div>

      <div className="soft" style={{ padding: 20, marginTop: 8 }}>
        <div className="body">
          오늘 강도 높은 4.8km 러닝에 UV 지수 6까지 겹쳤어요. 수분 보충과 가벼운 스트레칭으로 마무리하는 걸 추천해요.
        </div>
      </div>

      <div className="section">
        <div style={{ padding: '18px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div style={{ font: 'var(--type-body-strong)' }}>수분 보충</div>
          <div className="cap" style={{ marginTop: 4 }}>500ml 물 또는 이온음료</div>
        </div>
        <div style={{ padding: '18px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div style={{ font: 'var(--type-body-strong)' }}>쿨다운 스트레칭</div>
          <div className="cap" style={{ marginTop: 4 }}>종아리·햄스트링 위주 5분</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '26px 0 8px' }}>
          <div className="cap-sm">쿨다운 타이머</div>
          <div style={{
            width: 172, height: 172, borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `conic-gradient(var(--ink) ${(((COOL_TOTAL - cool) / COOL_TOTAL) * 360).toFixed(1)}deg, var(--hairline-soft) 0)`,
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
