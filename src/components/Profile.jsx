import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { PencilIcon } from './Icons.jsx'
import { GOAL_TYPES } from '../data.js'

export default function Profile({ user, goal, onSaveGoal, onLogout }) {
  const [sheet, setSheet] = useState(null) // 'goal' | 'logout' | null
  const [draft, setDraft] = useState(goal)

  const name = user.nickname?.trim() || '김러너'
  const email = user.email?.trim() || 'runner.kim@aftergrow.kr'

  const openGoal = () => { setDraft(goal); setSheet('goal') }

  return (
    <>
      <div className="scroll" style={{ paddingBottom: 88 }}>
        <div className="soft" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '28px 20px' }}>
          <div style={{ flex: 'none', position: 'relative', width: 76, height: 76 }}>
            <div
              className="display"
              style={{ width: 76, height: 76, borderRadius: 'var(--radius-full)', background: 'var(--ink)', color: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}
            >
              {name.charAt(0)}
            </div>
            <button
              className="press"
              aria-label="프로필 사진 수정"
              style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderRadius: 'var(--radius-full)', border: '2px solid var(--soft-cloud)', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <PencilIcon size={13} />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 34 }}>{name}</div>
            <div className="cap" style={{ color: 'var(--charcoal)', marginTop: 8 }}>{email}</div>
            <div className="cap-sm" style={{ marginTop: 2 }}>2026년 5월 가입 · 6주 연속 러닝</div>
          </div>
        </div>

        <div className="stat-grid c3 bordered-b section">
          <div className="stat"><div className="k">누적 러닝</div><div className="n">38회</div></div>
          <div className="stat"><div className="k">누적 거리</div><div className="n">172km</div></div>
          <div className="stat"><div className="k">연속 주</div><div className="n">6주</div></div>
        </div>

        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
            <div className="h-lg">목표</div>
            <button
              onClick={openGoal}
              className="press"
              style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption-md)', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              수정
            </button>
          </div>
          <div className="row">목표 유형<span className="v">{goal.type}</span></div>
          <div className="row">주간 러닝 목표<span className="v">주 {goal.freq}회</span></div>

          <div className="h-lg" style={{ padding: '24px 0 12px' }}>연동 상태</div>
          <div className="row">워치 연동<span className="v ok">연결됨</span></div>
          <div className="row">카메라 권한<span className="v ok">허용됨</span></div>
          <div className="row">위치 권한<span className="v bad">거부됨</span></div>

          <div className="h-lg" style={{ padding: '24px 0 12px' }}>알림</div>
          <div className="row">러닝 리마인더<span className="v mute">매일 오전 7시</span></div>
          <div className="row">UV 경보<span className="v mute">지수 6 이상</span></div>

          <div style={{ padding: '24px 0 28px' }}>
            <button className="btn lg full secondary" onClick={() => setSheet('logout')}>로그아웃</button>
          </div>
        </div>
      </div>

      {sheet === 'goal' && (
        <Sheet label="목표 수정" onClose={() => setSheet(null)}>
          {(close) => (
            <>
              <div className="sheet-title">목표 수정</div>

              <div className="cap" style={{ marginTop: 20 }}>목표 유형</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {GOAL_TYPES.map(([name]) => {
                  const on = draft.type === name
                  return (
                    <button
                      key={name}
                      className="press"
                      onClick={() => setDraft((d) => ({ ...d, type: name }))}
                      style={{
                        border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                        borderRadius: 'var(--radius-full)', padding: '10px 16px',
                        font: 'var(--type-button-sm)', cursor: 'pointer',
                        background: on ? 'var(--ink)' : 'var(--canvas)',
                        color: on ? 'var(--canvas)' : 'var(--charcoal)',
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>

              <div className="cap" style={{ marginTop: 22 }}>주간 러닝 목표</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div className="display" style={{ fontSize: 40 }}>주 {draft.freq}회</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="step-btn" aria-label="줄이기" disabled={draft.freq <= 1} onClick={() => setDraft((d) => ({ ...d, freq: Math.max(1, d.freq - 1) }))}>-</button>
                  <button className="step-btn" aria-label="늘리기" disabled={draft.freq >= 7} onClick={() => setDraft((d) => ({ ...d, freq: Math.min(7, d.freq + 1) }))}>+</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
                <button className="btn lg full secondary" onClick={close}>취소</button>
                <button className="btn lg full" onClick={() => { onSaveGoal(draft); close() }}>저장</button>
              </div>
            </>
          )}
        </Sheet>
      )}

      {sheet === 'logout' && (
        <Sheet label="로그아웃" onClose={() => setSheet(null)}>
          {(close) => (
            <>
              <div className="sheet-title">로그아웃 하시겠어요?</div>
              <div className="body" style={{ marginTop: 10 }}>다시 로그인하려면 이메일과 비밀번호가 필요해요</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn lg full secondary" onClick={close}>취소</button>
                <button className="btn lg full" onClick={onLogout}>로그아웃</button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </>
  )
}
