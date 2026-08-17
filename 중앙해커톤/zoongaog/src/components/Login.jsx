import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { PulseIcon } from './Icons.jsx'

const TERMS = {
  terms: {
    label: '서비스 이용약관',
    body: (
      <>
        <h4>제1조 (목적)</h4>
        <p>이 약관은 AURA(이하 "회사")가 제공하는 러닝 기록 및 심박수 측정 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        <h4>제2조 (서비스의 제공)</h4>
        <p>회사는 러닝 트래킹, 심박수 측정(rPPG·워치 연동), 회복 솔루션 제공 등의 기능을 제공하며, 서비스의 내용은 운영상 필요에 따라 변경될 수 있습니다.</p>
        <h4>제3조 (회원의 의무)</h4>
        <p>회원은 정확한 정보로 가입해야 하며, 측정된 건강 데이터는 참고용으로만 활용하고 의료적 진단을 대체할 수 없습니다.</p>
      </>
    ),
  },
  privacy: {
    label: '개인정보 수집·이용 동의',
    body: (
      <>
        <h4>수집 항목</h4>
        <p>닉네임, 이메일, 비밀번호, 러닝 기록(거리·시간·경로), 심박수 측정값, 기기 연동 정보(워치·카메라·위치 권한)</p>
        <h4>수집 목적</h4>
        <p>회원 식별 및 로그인, 러닝·심박수 기록 저장, 맞춤 회복 솔루션 제공, 서비스 품질 개선</p>
        <h4>보유 기간</h4>
        <p>회원 탈퇴 시까지 보관하며, 탈퇴 후에는 관계 법령이 정한 기간 동안 보관 후 지체 없이 파기합니다.</p>
      </>
    ),
  },
  marketing: {
    label: '마케팅 정보 수신 동의 (선택)',
    body: (
      <>
        <h4>수신 목적</h4>
        <p>신규 기능 안내, 러닝 이벤트·챌린지 소식, 맞춤 프로모션 정보를 이메일 또는 앱 알림으로 보내드려요.</p>
        <h4>동의 철회</h4>
        <p>동의하지 않아도 서비스 이용에는 제한이 없으며, 프로필 &gt; 알림 설정에서 언제든 수신을 거부할 수 있어요.</p>
      </>
    ),
  },
}

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ nickname: '', email: '', password: '', confirm: '' })
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false })
  const [touched, setTouched] = useState(false)
  const [termsSheet, setTermsSheet] = useState(null) // 'terms' | 'privacy' | 'marketing' | null

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const switchMode = (next) => {
    setMode(next)
    setTouched(false)
  }

  const emailValid = /\S+@\S+\.\S+/.test(form.email)
  const passwordValid = form.password.length >= 4
  const confirmValid = mode === 'login' || form.password === form.confirm
  const nicknameValid = mode === 'login' || form.nickname.trim().length > 0
  const requiredAgreed = mode === 'login' || (agree.terms && agree.privacy)
  const allAgreed = agree.terms && agree.privacy && agree.marketing
  const formValid = emailValid && passwordValid && confirmValid && nicknameValid && requiredAgreed

  const toggleAll = () => {
    const next = !allAgreed
    setAgree({ terms: next, privacy: next, marketing: next })
  }

  const submit = () => {
    setTouched(true)
    if (formValid) onAuth()
  }

  return (
    <section className="page">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PulseIcon size={14} /> AURA
      </div>
      <div className="title">시작하기</div>
      <div className="sub">러닝 데이터와 심박수를 기록하려면 로그인해주세요</div>

      <div className="tabs">
        <div className={`tab-opt ${mode === 'login' ? 'on' : ''}`} onClick={() => switchMode('login')}>로그인</div>
        <div className={`tab-opt ${mode === 'signup' ? 'on' : ''}`} onClick={() => switchMode('signup')}>회원가입</div>
      </div>

      <div className="box">
        {mode === 'signup' && (
          <div className="field" style={{ marginTop: 0 }}>
            <label>닉네임</label>
            <input
              type="text"
              placeholder="예: 김러너"
              value={form.nickname}
              onChange={setField('nickname')}
              className={touched && !nicknameValid ? 'invalid' : ''}
            />
            {touched && !nicknameValid && <div className="err">닉네임을 입력해주세요</div>}
          </div>
        )}
        <div className="field" style={mode === 'login' ? { marginTop: 0 } : undefined}>
          <label>이메일</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={setField('email')}
            className={touched && !emailValid ? 'invalid' : ''}
          />
          {touched && !emailValid && <div className="err">올바른 이메일 형식을 입력해주세요</div>}
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input
            type="password"
            placeholder="4자 이상 입력"
            value={form.password}
            onChange={setField('password')}
            className={touched && !passwordValid ? 'invalid' : ''}
          />
          {touched && !passwordValid && <div className="err">비밀번호는 4자 이상이어야 해요</div>}
        </div>
        {mode === 'signup' && (
          <div className="field">
            <label>비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호 다시 입력"
              value={form.confirm}
              onChange={setField('confirm')}
              className={touched && !confirmValid ? 'invalid' : ''}
            />
            {touched && !confirmValid && <div className="err">비밀번호가 일치하지 않아요</div>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="agree-box">
            <div className="agree-row all">
              <label>
                <input type="checkbox" checked={allAgreed} onChange={toggleAll} />
                <span>약관 전체 동의</span>
              </label>
            </div>

            {Object.entries(TERMS).map(([key, t]) => (
              <div className="agree-row" key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={agree[key]}
                    onChange={(e) => setAgree((a) => ({ ...a, [key]: e.target.checked }))}
                  />
                  <span>{key === 'marketing' ? t.label : `[필수] ${t.label}`}</span>
                </label>
                <button
                  type="button"
                  className="agree-view"
                  onClick={() => setTermsSheet(key)}
                >
                  보기
                </button>
              </div>
            ))}

            {touched && !requiredAgreed && <div className="err">필수 약관에 동의해주세요</div>}
          </div>
        )}

        <button className="btn block primary" onClick={submit}>
          {mode === 'login' ? '로그인' : '회원가입 완료'}
        </button>
      </div>

      <div className="link-row">
        {mode === 'login'
          ? <>계정이 없으신가요? <span onClick={() => switchMode('signup')}>회원가입</span></>
          : <>이미 계정이 있으신가요? <span onClick={() => switchMode('login')}>로그인</span></>}
      </div>

      {termsSheet && (
        <Sheet eyebrow="약관" title={TERMS[termsSheet].label} onClose={() => setTermsSheet(null)}>
          <div className="terms-body">{TERMS[termsSheet].body}</div>
          <button className="btn block primary" onClick={() => setTermsSheet(null)}>확인</button>
        </Sheet>
      )}
    </section>
  )
}