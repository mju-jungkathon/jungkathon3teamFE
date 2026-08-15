import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { TERMS } from '../data.js'

const EMPTY_AGREE = { terms: false, privacy: false, marketing: false }

export default function Auth({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ nickname: '', email: '', password: '', confirm: '' })
  const [agree, setAgree] = useState(EMPTY_AGREE)
  const [touched, setTouched] = useState(false)
  const [termsKey, setTermsKey] = useState(null)

  const signup = mode === 'signup'
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const switchMode = (next) => { setMode(next); setTouched(false) }

  const emailOk = /\S+@\S+\.\S+/.test(form.email)
  const pwOk = form.password.length >= 4
  const nickOk = !signup || form.nickname.trim().length > 0
  const confirmOk = !signup || form.password === form.confirm
  const agreedReq = !signup || (agree.terms && agree.privacy)
  const allAgreed = agree.terms && agree.privacy && agree.marketing
  const valid = emailOk && pwOk && nickOk && confirmOk && agreedReq

  const submit = () => {
    setTouched(true)
    if (!valid) return
    const payload = { nickname: form.nickname, email: form.email }
    if (signup) onSignup(payload)
    else onLogin(payload)
  }

  const activeTerms = TERMS.find((t) => t.key === termsKey)
  const err = (bad) => (touched && bad ? 'invalid' : '')

  return (
    <>
      <div className="scroll">
        <div style={{ position: 'relative' }}>
          <img
            src="https://picsum.photos/seed/aftergrow-city-runner-dawn/780/720"
            alt="러너"
            style={{ display: 'block', width: '100%', aspectRatio: '13/12', objectFit: 'cover', background: 'var(--soft-cloud)' }}
          />
          <div style={{ position: 'absolute', left: 20, bottom: 20 }}>
            <div className="display" style={{ fontSize: 22, letterSpacing: '.06em', color: 'var(--canvas)' }}>AFTERGROW</div>
            <div className="display" style={{ fontSize: 54, color: 'var(--canvas)', marginTop: 8, whiteSpace: 'pre-line' }}>
              {signup ? 'JOIN\nAFTERGROW' : 'WELCOME\nBACK'}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', boxShadow: 'inset 0 -1px 0 var(--hairline)' }}>
            {[['login', '로그인'], ['signup', '회원가입']].map(([id, label]) => (
              <button
                key={id}
                className="press"
                onClick={() => switchMode(id)}
                style={{
                  flex: 1, height: 46, border: 'none', background: 'none', cursor: 'pointer',
                  font: 'var(--type-button-md)',
                  color: mode === id ? 'var(--ink)' : 'var(--mute)',
                  boxShadow: mode === id ? 'inset 0 -2px 0 var(--ink)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="body">
            {signup
              ? '러닝 기록과 회복 가이드를 저장하려면 계정이 필요해요'
              : '러닝 데이터와 심박수를 기록하려면 로그인해주세요'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {signup && (
              <div className="field">
                <label htmlFor="nickname">닉네임</label>
                <input id="nickname" type="text" placeholder="예: 김러너" value={form.nickname} onChange={set('nickname')} className={err(!nickOk)} />
                {touched && !nickOk && <div className="err">닉네임을 입력해주세요</div>}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">이메일</label>
              <input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} className={err(!emailOk)} />
              {touched && !emailOk && <div className="err">올바른 이메일 형식을 입력해주세요</div>}
            </div>

            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input id="password" type="password" placeholder="4자 이상 입력" value={form.password} onChange={set('password')} className={err(!pwOk)} />
              {touched && !pwOk && <div className="err">비밀번호는 4자 이상이어야 해요</div>}
            </div>

            {signup && (
              <div className="field">
                <label htmlFor="confirm">비밀번호 확인</label>
                <input id="confirm" type="password" placeholder="비밀번호 다시 입력" value={form.confirm} onChange={set('confirm')} className={err(!confirmOk)} />
                {touched && !confirmOk && <div className="err">비밀번호가 일치하지 않아요</div>}
              </div>
            )}
          </div>

          {signup && (
            <div>
              <button
                className="press"
                onClick={() => setAgree(allAgreed ? EMPTY_AGREE : { terms: true, privacy: true, marketing: true })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', border: 'none', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline-soft)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span className={`check ${allAgreed ? 'on' : ''}`}>✓</span>
                <span style={{ font: 'var(--type-body-strong)' }}>약관 전체 동의</span>
              </button>

              {TERMS.map((t, i) => (
                <div
                  key={t.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${i === TERMS.length - 1 ? 'var(--hairline)' : 'var(--hairline-soft)'}` }}
                >
                  <button
                    className="press"
                    onClick={() => setAgree((a) => ({ ...a, [t.key]: !a[t.key] }))}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  >
                    <span className={`check ${agree[t.key] ? 'on' : ''}`}>✓</span>
                    <span className="cap" style={{ color: 'var(--charcoal)' }}>{t.label}</span>
                  </button>
                  <button
                    className="press"
                    onClick={() => setTermsKey(t.key)}
                    style={{ flex: 'none', border: 'none', background: 'none', font: 'var(--type-caption-sm)', color: 'var(--mute)', textDecoration: 'underline', cursor: 'pointer', padding: '8px 0 8px 8px' }}
                  >
                    보기
                  </button>
                </div>
              ))}

              {touched && !agreedReq && <div className="err" style={{ marginTop: 10 }}>필수 약관에 동의해주세요</div>}
            </div>
          )}

          <button className="btn lg full" onClick={submit}>{signup ? '회원가입 완료' : '로그인'}</button>

          <div className="cap" style={{ textAlign: 'center' }}>
            {signup ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
            <button
              className="press"
              onClick={() => switchMode(signup ? 'login' : 'signup')}
              style={{ border: 'none', background: 'none', font: 'var(--type-caption-md)', color: 'var(--ink)', cursor: 'pointer', padding: '0 0 0 4px', textDecoration: 'underline' }}
            >
              {signup ? '로그인' : '회원가입'}
            </button>
          </div>
        </div>
      </div>

      {activeTerms && (
        <Sheet label={activeTerms.label} onClose={() => setTermsKey(null)}>
          {(close) => (
            <>
              <div className="sheet-title" style={{ fontSize: 26, lineHeight: 1.05 }}>
                {activeTerms.label.replace('[필수] ', '')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                {activeTerms.body.map(([h, p]) => (
                  <div key={h} style={{ padding: '16px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                    <div style={{ font: 'var(--type-body-strong)' }}>{h}</div>
                    <div className="body" style={{ marginTop: 6 }}>{p}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="btn lg full" onClick={close}>확인</button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </>
  )
}
