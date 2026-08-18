import React, { useState } from 'react';
import { authApi } from '../api/authApi';

export default function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await authApi.login({ email, password });
      alert('로그인 성공!');
      onNavigate('profile'); // 로그인 성공 시 프로필 페이지로 이동
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMsg('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else {
        setErrorMsg('로그인 처리 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div>
      <h2>로그인</h2>
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
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        <button type="submit">로그인</button>
      </form>
      <button onClick={() => onNavigate('signup')}>회원가입하러 가기</button>
    </div>
  );
}