/* ===================================================
   Login 컴포넌트 (로그인 카드)
   - 로그인 페이지의 메인 영역 (바디 부분)
   - 화면 가운데에 흰색 카드가 떠있는 구조
   - 이메일/비밀번호 입력 → 로그인 버튼
   - 아이디/비밀번호 찾기, 회원가입 링크
   - 소셜 로그인: 카카오톡, 네이버
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; /* 페이지 이동 도구 */
import { login, BASE_URL } from '../../api/apiAxios';  /* 로그인 API 함수 + 서버 주소 */
import './Login.css';

export default function Login() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  const [email, setEmail] = useState('');          /* 이메일 주소 (= 아이디) */
  const [password, setPassword] = useState('');     /* 비밀번호 */
  const [error, setError] = useState('');           /* 에러 메시지 */
  const [isLoading, setIsLoading] = useState(false); /* 로딩 중? */

  /* --- 로그인 버튼 클릭 시 실행되는 함수 --- */
  const handleLogin = async (e) => {
    /* 페이지 새로고침 방지 */
    e.preventDefault();
    setError('');

    /* 입력값 확인 */
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      /* 서버에 로그인 요청 (이메일 = 아이디) */
      const data = await login(email, password);

      /* 로그인 성공 → JWT 토큰과 사용자 정보를 localStorage에 저장 */
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      /* 메인 페이지로 이동 */
      navigate('/');
    } catch (err) {
      /* 로그인 실패 → 에러 메시지 표시 */
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* --- 카카오 로그인 버튼 클릭 --- */
  /* 클릭하면 → 백엔드 서버로 이동 → 카카오 로그인 페이지로 자동 이동됨 */
  const handleKakaoLogin = () => {
    window.location.href = BASE_URL + '/api/user/kakao/login';
  };

  /* --- 네이버 로그인 버튼 클릭 --- */
  /* 클릭하면 → 백엔드 서버로 이동 → 네이버 로그인 페이지로 자동 이동됨 */
  const handleNaverLogin = () => {
    window.location.href = BASE_URL + '/api/user/naver/login';
  };

  return (
    <div className="login-wrapper">
      {/* ===== 로그인 카드 ===== */}
      {/* 화면 가운데에 위치하는 흰색 카드 */}
      <div className="login-card">

        {/* --- 제목 --- */}
        <h2 className="login-title">로그인</h2>

        {/* --- 로그인 폼 --- */}
        {/* form 태그: Enter 키를 눌러도 로그인이 실행됨 */}
        <form className="login-form" onSubmit={handleLogin}>

          {/* 이메일 입력 필드 */}
          <div className="login-input-group">
            <input
              type="email"
              className="login-input"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // ↑ 사용자가 글자를 입력할 때마다 email 상태가 업데이트됨
            />
          </div>

          {/* 비밀번호 입력 필드 */}
          <div className="login-input-group">
            <input
              type="password"
              className="login-input"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 에러 메시지 (있을 때만 표시) */}
          {error && <p className="login-error">{error}</p>}

          {/* 로그인 버튼 */}
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

        </form>

        {/* --- 아이디/비밀번호 찾기 + 회원가입 링크 --- */}
        <div className="login-links">
          <a className="login-link" onClick={() => navigate('/find-account')} style={{ cursor: 'pointer' }}>아이디/비밀번호 찾기</a>
          <span className="login-link-divider">|</span>
          <a className="login-link" onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>회원가입</a>
        </div>

        {/* --- 소셜 로그인 구분선 --- */}
        <div className="login-divider">
          <span>또는</span>
        </div>

        {/* --- 소셜 로그인 버튼들 --- */}
        <div className="login-social">

          {/* 카카오톡 로그인 버튼 */}
          <button className="social-btn kakao-btn" onClick={handleKakaoLogin}>
            카카오톡으로 시작하기
          </button>

          {/* 네이버 로그인 버튼 */}
          <button className="social-btn naver-btn" onClick={handleNaverLogin}>
            네이버로 시작하기
          </button>

        </div>

      </div>
    </div>
  );
}
