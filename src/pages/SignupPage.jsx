import React, { useState } from 'react';
import { authApi } from '../api/authApi';

export default function SignupPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await authApi.signup({ email, password, nickname });
      alert('회원가입이 완료되었습니다! 로그인해 주세요.');
      onNavigate('login');
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg('이미 가입된 이메일입니다.');
      } else {
        setErrorMsg(err.response?.data?.message || '회원가입 실패');
      }
    }
  };

  return (
    <div>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        <button type="submit">가입하기</button>
      </form>
      <button onClick={() => onNavigate('login')}>로그인 화면으로 돌아가기</button>
    </div>
  );
}