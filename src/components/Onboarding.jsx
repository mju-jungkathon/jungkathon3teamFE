import { useState } from 'react'
import { GOAL_TYPES } from '../data.js'

const freqHint = (n) =>
  n <= 2 ? '가볍게 시작하는 페이스' : n <= 4 ? '가장 많은 러너가 선택하는 빈도' : '회복 관리가 특히 중요한 빈도'

// 회원가입 직후 1회만 보는 목표 설정 화면.
export default function Onboarding({ nickname, onDone }) {
  const [type, setType] = useState(null)
  const [freq, setFreq] = useState(4)

  return (
    <div className="scroll">
      <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 20px 28px', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 40, height: 3, background: 'var(--ink)' }} />
            <div style={{ width: 40, height: 3, background: 'var(--ink)' }} />
          </div>
          <div className="display" style={{ fontSize: 52, lineHeight: .92, marginTop: 20, whiteSpace: 'pre-line' }}>
            {`${nickname?.trim() || '러너'}님\n환영해요`}
          </div>
          <div className="body" style={{ marginTop: 10 }}>목표를 알려주면 러닝 후 회복 가이드를 목표에 맞춰 조정해요</div>
        </div>

        <div>
          <div className="cap">어떤 목적으로 뛰나요</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            {GOAL_TYPES.map(([name, desc]) => (
              <button
                key={name}
                className={`pick ${type === name ? 'on' : ''}`}
                onClick={() => setType(name)}
                style={{ minHeight: 86 }}
              >
                <span className="pt">{name}</span>
                <span className="pd">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="cap">일주일에 몇 번 뛸 계획인가요</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              <div className="display" style={{ fontSize: 46, lineHeight: 1 }}>주 {freq}회</div>
              <div className="cap-sm" style={{ marginTop: 4 }}>{freqHint(freq)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="step-btn" aria-label="줄이기" disabled={freq <= 1} onClick={() => setFreq((f) => Math.max(1, f - 1))}>-</button>
              <button className="step-btn" aria-label="늘리기" disabled={freq >= 7} onClick={() => setFreq((f) => Math.min(7, f + 1))}>+</button>
            </div>
          </div>
        </div>

        <div>
          <button className="btn lg full" disabled={!type} onClick={() => onDone(type, freq)}>
            {type ? '시작하기' : '목적을 선택해주세요'}
          </button>
          <div className="cap-sm" style={{ textAlign: 'center', marginTop: 12 }}>프로필에서 언제든 바꿀 수 있어요</div>
        </div>
      </div>
    </div>
  )
}
