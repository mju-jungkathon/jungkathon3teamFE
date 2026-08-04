import { useState } from 'react'

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login') // login | signup

  return (
    <section className="page">
      <div className="label">AURA</div>
      <div className="title">시작하기</div>
      <div className="sub">러닝 데이터와 심박수를 기록하려면 로그인해주세요</div>

      <div className="tabs">
        <div className={`tab-opt ${mode === 'login' ? 'on' : ''}`} onClick={() => setMode('login')}>로그인</div>
        <div className={`tab-opt ${mode === 'signup' ? 'on' : ''}`} onClick={() => setMode('signup')}>회원가입</div>
      </div>

      <div className="box">
        {mode === 'signup' && (
          <div className="field">
            <label>닉네임</label>
            <input type="text" placeholder="예: 김러너" />
          </div>
        )}
        <div className="field">
          <label>이메일</label>
          <input type="email" placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" placeholder="비밀번호 입력" />
        </div>
        {mode === 'signup' && (
          <div className="field">
            <label>비밀번호 확인</label>
            <input type="password" placeholder="비밀번호 다시 입력" />
          </div>
        )}

        <button className="btn block primary" onClick={onAuth}>
          {mode === 'login' ? '로그인' : '회원가입 완료'}
        </button>
      </div>

      <div className="link-row">
        {mode === 'login'
          ? <>계정이 없으신가요? <span onClick={() => setMode('signup')}>회원가입</span></>
          : <>이미 계정이 있으신가요? <span onClick={() => setMode('login')}>로그인</span></>}
      </div>
    </section>
  )
}
