import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, BASE_URL } from '../../api/apiAxios';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('login-active');
    return () => document.body.classList.remove('login-active');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await login(userId, password);
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    window.location.href = BASE_URL + '/api/user/kakao/login';
  };

  const handleNaverLogin = () => {
    window.location.href = BASE_URL + '/api/user/naver/login';
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-hero-content">
          <h1 className="login-hero-title">OVEN ROAD</h1>
          <p className="login-hero-subtitle">나만의 빵집 코스 공유 플랫폼</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">로그인</h2>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">아이디</label>
              <input
                type="text"
                className="login-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label">비밀번호</label>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <i className="fi fi-rs-eye"></i> : <i className="fi fi-rs-crossed-eye"></i>}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-checkbox-label">
                <input type="checkbox" className="login-checkbox" />
                <span className="login-checkbox-circle"></span>
                <span>아이디 저장</span>
              </label>
              <label className="login-checkbox-label">
                <input type="checkbox" className="login-checkbox" />
                <span className="login-checkbox-circle"></span>
                <span>자동 로그인</span>
              </label>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-links">
            <a className="login-link" onClick={() => navigate('/find-account')}>아이디 찾기</a>
            <span className="login-link-divider">|</span>
            <a className="login-link" onClick={() => navigate('/find-account')}>비밀번호 찾기</a>
            <span className="login-link-divider">|</span>
            <a className="login-link" onClick={() => navigate('/signup')}>회원가입</a>
          </div>

          <div className="login-divider">
            <span>간편로그인</span>
          </div>

          <div className="login-social">
            <button type="button" className="social-btn naver-btn" onClick={handleNaverLogin}>
              네이버로 시작하기
            </button>
            <button type="button" className="social-btn kakao-btn" onClick={handleKakaoLogin}>
              카카오로 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
