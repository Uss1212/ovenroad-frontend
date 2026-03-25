/* ===================================================
   FindAccount 컴포넌트 (아이디/비밀번호 찾기)
   - 상단에 탭 2개: "아이디 찾기" / "비밀번호 찾기"
   - 이메일 입력 → 인증번호 전송 → 인증 확인
   - 아이디 찾기: 인증 후 가입된 아이디 표시
   - 비밀번호 찾기: 인증 후 새 비밀번호 입력 → 변경
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, verifyEmailCode, findId, resetPassword } from '../../api/api';
import './FindAccount.css';

export default function FindAccount() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  /* activeTab: 현재 선택된 탭 ("id" = 아이디 찾기, "pw" = 비밀번호 찾기) */
  const [activeTab, setActiveTab] = useState('id');

  /* 이메일 주소 입력값 */
  const [email, setEmail] = useState('');
  /* 인증번호 입력값 */
  const [verifyCode, setVerifyCode] = useState('');

  /* 인증번호 전송 완료 여부 */
  const [isCodeSent, setIsCodeSent] = useState(false);
  /* 인증 확인 완료 여부 */
  const [isVerified, setIsVerified] = useState(false);

  /* --- 아이디 찾기 결과 --- */
  const [foundId, setFoundId] = useState('');           /* 찾은 아이디 (일부 가림) */
  const [socialInfo, setSocialInfo] = useState(null);   /* 소셜 로그인 계정이면 { socialType, socialName } */

  /* --- 비밀번호 재설정 --- */
  const [newPassword, setNewPassword] = useState('');         /* 새 비밀번호 */
  const [newPasswordConfirm, setNewPasswordConfirm] = useState(''); /* 새 비밀번호 확인 */
  const [isPasswordReset, setIsPasswordReset] = useState(false);    /* 비밀번호 변경 완료? */

  /* --- 3분 타이머 상태 --- */
  const [timeLeft, setTimeLeft] = useState(0);   /* 남은 시간 (초) */
  const timerRef = useRef(null);                  /* 타이머 ID 저장 */

  /* --- 타이머 카운트다운 --- */
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  /* --- 남은 시간을 "0:00" 형식으로 바꿔주는 함수 --- */
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  /* --- 탭 전환 시 모든 입력값 초기화 --- */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail('');
    setVerifyCode('');
    setIsCodeSent(false);
    setIsVerified(false);
    setTimeLeft(0);
    clearTimeout(timerRef.current);
    setFoundId('');
    setSocialInfo(null);
    setNewPassword('');
    setNewPasswordConfirm('');
    setIsPasswordReset(false);
  };

  /* --- 인증번호 전송 버튼 클릭 --- */
  const handleSendCode = async () => {
    if (!email) return;
    try {
      await sendEmailVerification(email);
      setIsCodeSent(true);
      setTimeLeft(180); /* 3분 타이머 시작 */
    } catch (err) {
      alert(err.message);
    }
  };

  /* --- 인증번호 재전송 버튼 클릭 --- */
  const handleResendCode = async () => {
    try {
      await sendEmailVerification(email);
      setTimeLeft(180);
      setVerifyCode('');
    } catch (err) {
      alert(err.message);
    }
  };

  /* --- 인증번호 확인 버튼 클릭 --- */
  const handleVerifyCode = async () => {
    if (!verifyCode) return;
    if (timeLeft <= 0) {
      alert('인증 시간이 만료되었습니다. 다시 전송해주세요.');
      return;
    }
    try {
      await verifyEmailCode(email, verifyCode);
      setIsVerified(true);
      clearTimeout(timerRef.current);
    } catch (err) {
      alert(err.message);
    }
  };

  /* --- 아이디 찾기 제출 --- */
  const handleFindId = async () => {
    if (!isVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }
    try {
      const data = await findId(email);
      /* 소셜 로그인 계정이면 소셜 안내 화면으로 전환 */
      if (data.socialType) {
        setSocialInfo({ socialType: data.socialType, socialName: data.socialName });
      } else {
        setFoundId(data.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /* --- 비밀번호 재설정 제출 --- */
  const handleResetPassword = async () => {
    if (!isVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }
    if (!newPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await resetPassword(email, newPassword);
      setIsPasswordReset(true);
    } catch (err) {
      alert(err.message);
    }
  };

  /* --- 폼 제출 --- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'id') {
      handleFindId();
    } else {
      handleResetPassword();
    }
  };

  return (
    <div className="find-wrapper">
      <div className="find-card">

        {/* --- 제목 --- */}
        <h2 className="find-title">아이디 / 비밀번호 찾기</h2>

        {/* --- 탭 메뉴 --- */}
        <div className="find-tabs">
          <button
            className={`find-tab ${activeTab === 'id' ? 'active' : ''}`}
            onClick={() => handleTabChange('id')}
          >
            아이디 찾기
          </button>
          <button
            className={`find-tab ${activeTab === 'pw' ? 'active' : ''}`}
            onClick={() => handleTabChange('pw')}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* --- 폼 영역 --- */}
        <form className="find-form" onSubmit={handleSubmit}>

          {/* ===== 소셜 로그인 계정 안내 화면 ===== */}
          {activeTab === 'id' && socialInfo ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                background: '#fffbeb', borderRadius: '12px', padding: '28px 20px',
                marginBottom: '24px', border: '1px solid #fde68a',
              }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>
                  {socialInfo.socialType === 'naver' ? '🟢' : socialInfo.socialType === 'kakao' ? '💛' : '🔗'}
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
                  {socialInfo.socialName} 로그인으로 가입된 계정입니다.
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  {socialInfo.socialName} 로그인으로 다시 로그인해주세요.
                </p>
              </div>
              <button
                type="button"
                className="find-submit-btn"
                onClick={() => navigate('/login')}
                style={{ marginTop: '0' }}
              >
                로그인하러 가기
              </button>
            </div>
          ) : activeTab === 'id' && foundId ? (
            /* ===== 아이디 찾기 결과 화면 ===== */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {/* 결과 카드 */}
              <div style={{
                background: '#f9fafb', borderRadius: '12px', padding: '28px 20px',
                marginBottom: '24px', border: '1px solid #e5e7eb',
              }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  가입된 아이디를 찾았습니다.
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
                  {foundId}
                </p>
              </div>
              {/* 로그인 / 비밀번호 찾기 버튼 */}
              <button
                type="button"
                className="find-submit-btn"
                onClick={() => navigate('/login')}
                style={{ marginTop: '0' }}
              >
                로그인하러 가기
              </button>
              <p
                style={{
                  fontSize: '13px', color: '#888', marginTop: '16px', cursor: 'pointer',
                }}
                onClick={() => handleTabChange('pw')}
              >
                비밀번호가 기억나지 않으세요? <span style={{ color: '#111', fontWeight: 600, textDecoration: 'underline' }}>비밀번호 찾기</span>
              </p>
            </div>
          ) : activeTab === 'pw' && isPasswordReset ? (
            /* ===== 비밀번호 변경 완료 화면 ===== */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                background: '#f0fdf4', borderRadius: '12px', padding: '28px 20px',
                marginBottom: '24px', border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
                  비밀번호가 변경되었습니다!
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  새 비밀번호로 로그인해주세요.
                </p>
              </div>
              <button
                type="button"
                className="find-submit-btn"
                onClick={() => navigate('/login')}
                style={{ marginTop: '0' }}
              >
                로그인하러 가기
              </button>
            </div>
          ) : (
            /* ===== 이메일 인증 + 입력 폼 ===== */
            <>
              {/* 이메일 주소 + 인증번호 전송 버튼 */}
              <div className="find-input-group find-input-row">
                <input
                  type="email"
                  className="find-input"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerified}
                />
                <button
                  type="button"
                  className={`find-side-btn ${isCodeSent && timeLeft > 0 ? 'done' : ''}`}
                  onClick={handleSendCode}
                  disabled={isCodeSent && timeLeft > 0}
                >
                  {isCodeSent && timeLeft > 0 ? '전송완료' : isCodeSent ? '재전송' : '인증번호 전송'}
                </button>
              </div>

              {/* 인증번호 입력 + 확인/재전송 버튼 */}
              <div className="find-input-group find-input-row">
                <input
                  type="text"
                  className="find-input"
                  placeholder="인증번호 입력"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  disabled={isVerified}
                />
                {!isVerified && isCodeSent && timeLeft <= 0 ? (
                  <button type="button" className="find-side-btn" onClick={handleResendCode}>
                    재전송
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`find-side-btn ${isVerified ? 'done' : ''}`}
                    onClick={handleVerifyCode}
                    disabled={isVerified}
                  >
                    {isVerified ? '인증완료' : '확인'}
                  </button>
                )}
              </div>

              {/* 타이머 */}
              {!isVerified && timeLeft > 0 && (
                <p style={{
                  fontSize: '13px', fontWeight: 700, margin: '0 0 8px',
                  color: timeLeft <= 30 ? '#ef4444' : '#c96442',
                }}>
                  남은 시간 {formatTime(timeLeft)}
                </p>
              )}

              {/* 인증 완료 메시지 */}
              {isVerified && (
                <p style={{ fontSize: '12px', color: '#22c55e', margin: '0 0 8px' }}>
                  이메일 인증이 완료되었습니다.
                </p>
              )}

              {/* ───── 비밀번호 찾기: 인증 완료 후 새 비밀번호 입력 ───── */}
              {activeTab === 'pw' && isVerified && (
                <>
                  <div className="find-input-group">
                    <input
                      type="password"
                      className="find-input"
                      placeholder="새 비밀번호 (영문+숫자+특수문자 8자 이상)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="find-input-group">
                    <input
                      type="password"
                      className="find-input"
                      placeholder="새 비밀번호 확인"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    />
                  </div>
                  {/* 비밀번호 일치 여부 표시 */}
                  {newPasswordConfirm && (
                    <p style={{
                      fontSize: '12px', margin: '0 0 4px',
                      color: newPassword === newPasswordConfirm ? '#22c55e' : '#ef4444',
                    }}>
                      {newPassword === newPasswordConfirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                    </p>
                  )}
                </>
              )}

              {/* 제출 버튼 */}
              <button type="submit" className="find-submit-btn">
                {activeTab === 'id' ? '아이디 찾기' : '비밀번호 재설정'}
              </button>
            </>
          )}

        </form>

      </div>
    </div>
  );
}
