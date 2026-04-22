/* ===================================================
   Signup 컴포넌트 (회원가입 페이지)
   - 회원가입에 필요한 모든 정보를 입력하는 페이지
   - DB USER 테이블 기준 필드:
     ID(아이디), USER_PW(비밀번호), NAME(이름),
     NICKNAME(닉네임), EMAIL(이메일)
   - 기능:
     1) 각 입력 필드별 유효성 검사 (형식 확인)
     2) 아이디/닉네임 중복 확인 (서버 API 호출)
     3) 이메일 인증번호 전송 + 확인
     4) 비밀번호와 비밀번호 재확인 일치 여부
     5) 모든 조건 통과 시 가입하기 버튼 활성화
     6) 가입 성공 → 로그인 페이지로 이동
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signup,
  checkNicknameDuplicate,
  sendEmailVerification,
  verifyEmailCode,
  BASE_URL,
} from '../../api/apiAxios';
import './Signup.css';

export default function Signup() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 사용하는 함수 */
  const navigate = useNavigate();

  /* ===================================================
     상태(state) 관리
     - 사용자가 입력하는 값들을 각각 저장
     - 에러 메시지도 각 필드별로 저장
     =================================================== */

  /* --- 입력값 상태 --- */
  const [password, setPassword] = useState('');           /* 비밀번호 */
  const [passwordConfirm, setPasswordConfirm] = useState(''); /* 비밀번호 재확인 */
  const [name, setName] = useState('');                   /* 이름 (실명) */
  const [nickname, setNickname] = useState('');            /* 닉네임 (별명) */
  const [email, setEmail] = useState('');                 /* 이메일 주소 */
  const [verifyCode, setVerifyCode] = useState('');       /* 이메일 인증번호 */

  /* --- 에러 메시지 상태 --- */
  /* 각 입력 필드 아래에 빨간 글씨로 표시할 에러 메시지 */
  const [errors, setErrors] = useState({
    password: '',       /* 비밀번호 에러 */
    passwordConfirm: '', /* 비밀번호 재확인 에러 */
    name: '',           /* 이름 에러 */
    nickname: '',       /* 닉네임 에러 */
    email: '',          /* 이메일 에러 */
    verifyCode: '',     /* 인증번호 에러 */
    general: '',        /* 전체 에러 (서버 에러 등) */
  });

  /* --- 확인/인증 완료 상태 --- */
  const [isNicknameChecked, setIsNicknameChecked] = useState(false); /* 닉네임 중복확인 완료? */
  const [isEmailSent, setIsEmailSent] = useState(false);       /* 이메일 인증번호 전송됨? */
  const [isVerified, setIsVerified] = useState(false);         /* 이메일 인증 완료? */
  const [isSubmitting, setIsSubmitting] = useState(false);     /* 가입 요청 중? (로딩) */

  /* --- 3분 타이머 상태 --- */
  const [timeLeft, setTimeLeft] = useState(0);   /* 남은 시간 (초) */
  const timerRef = useRef(null);                  /* 타이머 ID 저장 (나중에 멈출 때 사용) */

  /* --- 타이머 카운트다운 --- */
  /* timeLeft가 0보다 크면 1초마다 1씩 줄어듦 */
  useEffect(() => {
    /* 남은 시간이 0이면 타이머 안 돌림 */
    if (timeLeft <= 0) return;
    /* 1초 뒤에 남은 시간을 1 줄이는 타이머 */
    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    /* 컴포넌트가 사라지면 타이머도 정리 */
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  /* --- 남은 시간을 "0:00" 형식으로 바꿔주는 함수 --- */
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);  /* 분 */
    const sec = seconds % 60;              /* 초 */
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;  /* 예: 2:05 */
  };

  /* ===================================================
     유효성 검사 함수들
     - 사용자가 입력한 값이 올바른 형식인지 확인
     - 틀리면 에러 메시지를 설정
     =================================================== */

  /* --- 비밀번호 유효성 검사 --- */
  /* 규칙: 영문 + 숫자 + 특수문자 포함, 8~20자 */
  const validatePassword = (value) => {
    if (!value) return '비밀번호를 입력해주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (value.length > 20) return '비밀번호는 20자 이하여야 합니다.';
    /* 영문자가 하나라도 있는지 확인 */
    if (!/[a-zA-Z]/.test(value)) return '비밀번호에 영문자를 포함해주세요.';
    /* 숫자가 하나라도 있는지 확인 */
    if (!/[0-9]/.test(value)) return '비밀번호에 숫자를 포함해주세요.';
    /* 특수문자가 하나라도 있는지 확인 */
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return '비밀번호에 특수문자를 포함해주세요.';
    return '';
  };

  /* --- 비밀번호 재확인 검사 --- */
  /* 위에서 입력한 비밀번호와 같은지 확인 */
  const validatePasswordConfirm = (value) => {
    if (!value) return '비밀번호를 다시 입력해주세요.';
    if (value !== password) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  /* --- 이름 유효성 검사 --- */
  /* 규칙: 한글 2~10자 */
  const validateName = (value) => {
    if (!value) return '이름을 입력해주세요.';
    if (value.length < 2) return '이름은 2자 이상이어야 합니다.';
    if (!/^[가-힣]+$/.test(value)) return '이름은 한글만 입력할 수 있습니다.';
    return '';
  };

  /* --- 닉네임 유효성 검사 --- */
  /* 규칙: 한글, 영문, 숫자 조합, 2~12자 */
  const validateNickname = (value) => {
    if (!value) return '닉네임을 입력해주세요.';
    if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.';
    if (value.length > 12) return '닉네임은 12자 이하여야 합니다.';
    if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) return '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
    return '';
  };

  /* --- 이메일 유효성 검사 --- */
  /* 규칙: 이메일 형식 (xxx@xxx.xxx) */
  const validateEmail = (value) => {
    if (!value) return '이메일을 입력해주세요.';
    /* 이메일 형식 정규식: @ 앞뒤로 글자가 있고, . 뒤에 2자 이상 */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  };

  /* ===================================================
     입력값 변경 핸들러들
     - 사용자가 글자를 입력할 때마다 실행
     - 값을 저장하고, 실시간으로 유효성 검사
     - 중복확인/인증 상태도 초기화 (값이 바뀌었으니까)
     =================================================== */

  /* --- 비밀번호 입력 변경 --- */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: value ? validatePassword(value) : '',
      /* 비밀번호가 바뀌면 재확인도 다시 검사 */
      passwordConfirm: passwordConfirm ? (value === passwordConfirm ? '' : '비밀번호가 일치하지 않습니다.') : '',
    }));
  };

  /* --- 비밀번호 재확인 입력 변경 --- */
  const handlePasswordConfirmChange = (e) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    setErrors((prev) => ({ ...prev, passwordConfirm: value ? validatePasswordConfirm(value) : '' }));
  };

  /* --- 이름 입력 변경 --- */
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({ ...prev, name: value ? validateName(value) : '' }));
  };

  /* --- 닉네임 입력 변경 --- */
  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setNickname(value);
    /* 닉네임이 바뀌면 중복확인을 다시 해야 하므로 초기화 */
    setIsNicknameChecked(false);
    setErrors((prev) => ({ ...prev, nickname: value ? validateNickname(value) : '' }));
  };

  /* --- 이메일 입력 변경 --- */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    /* 이메일이 바뀌면 인증을 다시 해야 하므로 초기화 */
    setIsEmailSent(false);
    setIsVerified(false);
    setVerifyCode('');
    setErrors((prev) => ({ ...prev, email: value ? validateEmail(value) : '' }));
  };

  /* ===================================================
     버튼 클릭 핸들러들
     =================================================== */

  /* --- 닉네임 중복확인 버튼 클릭 --- */
  const handleCheckNickname = async () => {
    const error = validateNickname(nickname);
    if (error) {
      setErrors((prev) => ({ ...prev, nickname: error }));
      return;
    }

    try {
      await checkNicknameDuplicate(nickname);
      setIsNicknameChecked(true);
      setErrors((prev) => ({ ...prev, nickname: '' }));
    } catch (err) {
      /* 서버에서 에러가 오면 (예: 이미 사용 중인 닉네임) 에러 메시지 표시 */
      setErrors((prev) => ({ ...prev, nickname: err.message }));
    }
  };

  /* --- 이메일 인증번호 전송 버튼 클릭 --- */
  const handleSendEmail = async () => {
    const error = validateEmail(email);
    if (error) {
      setErrors((prev) => ({ ...prev, email: error }));
      return;
    }

    try {
      await sendEmailVerification(email);
      setIsEmailSent(true);
      setTimeLeft(180); /* 3분 = 180초 타이머 시작 */
      setErrors((prev) => ({ ...prev, email: '' }));
    } catch (err) {
      /* 서버에서 에러가 오면 에러 메시지 표시 */
      setErrors((prev) => ({ ...prev, email: err.message }));
    }
  };

  /* --- 인증번호 확인 버튼 클릭 --- */
  const handleVerifyCode = async () => {
    if (!verifyCode) {
      setErrors((prev) => ({ ...prev, verifyCode: '인증번호를 입력해주세요.' }));
      return;
    }
    /* 타이머가 만료되었으면 인증 불가 */
    if (timeLeft <= 0) {
      setErrors((prev) => ({ ...prev, verifyCode: '인증 시간이 만료되었습니다. 다시 전송해주세요.' }));
      return;
    }

    try {
      await verifyEmailCode(email, verifyCode);
      setIsVerified(true);
      clearTimeout(timerRef.current); /* 인증 성공하면 타이머 멈춤 */
      setErrors((prev) => ({ ...prev, verifyCode: '' }));
    } catch (err) {
      /* 인증코드가 틀리면 에러 메시지 표시 */
      setErrors((prev) => ({ ...prev, verifyCode: err.message }));
    }
  };

  /* --- 인증번호 재전송 버튼 클릭 --- */
  const handleResendEmail = async () => {
    try {
      await sendEmailVerification(email);
      setTimeLeft(180); /* 3분 타이머 다시 시작 */
      setVerifyCode('');
      setErrors((prev) => ({ ...prev, email: '', verifyCode: '' }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: err.message }));
    }
  };

  /* ===================================================
     가입하기 버튼 클릭 (폼 제출)
     =================================================== */
  const handleSignup = async (e) => {
    /* 페이지 새로고침 방지 */
    e.preventDefault();

    /* --- 모든 필드 유효성 검사 한번에 실행 --- */
    const newErrors = {
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(passwordConfirm),
      name: validateName(name),
      nickname: validateNickname(nickname),
      email: validateEmail(email),
      verifyCode: '',
      general: '',
    };

    /* 중복확인 안 했으면 에러 */
    if (!newErrors.nickname && !isNicknameChecked) {
      newErrors.nickname = '닉네임 중복확인을 해주세요.';
    }

    /* 이메일 인증 안 했으면 에러 */
    if (!newErrors.email && !isVerified) {
      newErrors.email = '이메일 인증을 완료해주세요.';
    }

    /* 에러 상태 업데이트 */
    setErrors(newErrors);

    /* 에러가 하나라도 있으면 가입 중단 */
    const hasError = Object.values(newErrors).some((msg) => msg !== '');
    if (hasError) return;

    /* --- 서버에 회원가입 요청 --- */
    setIsSubmitting(true);

    try {
      /* API 호출: 서버에 회원 정보 전송 */
      /* 이메일 주소가 곧 아이디! */
      await signup({
        id: email,
        password: password,
        name: name,
        nickname: nickname,
        email: email,
      });

      /* 가입 성공! → 로그인 페이지로 이동 */
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      /* 서버에서 에러가 오면 (예: 이미 가입된 이메일) 에러 메시지 표시 */
      setErrors((prev) => ({ ...prev, general: err.message }));
    } finally {
      /* 로딩 상태 해제 (성공이든 실패든) */
      setIsSubmitting(false);
    }
  };

  /* --- 소셜 가입 --- */
  const handleNaverSignup = () => {
    /* 네이버 로그인 페이지로 이동 (계정 없으면 자동 가입됨) */
    window.location.href = BASE_URL + '/api/user/naver/login';
  };

  const handleKakaoSignup = () => {
    /* 카카오 로그인 페이지로 이동 (계정 없으면 자동 가입됨) */
    window.location.href = BASE_URL + '/api/user/kakao/login';
  };

  return (
    <div className="signup-wrapper">
      {/* ===== 회원가입 카드 ===== */}
      <div className="signup-card">

        {/* --- 제목 --- */}
        <h2 className="signup-title">회원가입</h2>

        {/* --- 회원가입 폼 --- */}
        <form className="signup-form" onSubmit={handleSignup}>

          {/* ───── 이메일 입력 + 전송 버튼 (= 아이디) ───── */}
          <div className="signup-input-group">
            <div className="signup-input-row">
              <input
                type="email"
                className={`signup-input ${errors.email ? 'error' : ''}`}
                placeholder="이메일 주소"
                value={email}
                onChange={handleEmailChange}
                /* 인증 완료되면 수정 못하게 잠금 */
                disabled={isVerified}
              />
              <button
                type="button"
                className={`signup-side-btn ${isEmailSent && timeLeft > 0 ? 'done' : ''}`}
                onClick={handleSendEmail}
                disabled={isEmailSent && timeLeft > 0}
              >
                {isEmailSent && timeLeft > 0 ? '전송완료' : isEmailSent ? '재전송' : '전송'}
              </button>
            </div>
            {errors.email && <p className="signup-error">{errors.email}</p>}
          </div>

          {/* ───── 인증번호 입력 + 타이머 + 확인/재전송 버튼 ───── */}
          {/* 이메일을 전송한 후에만 보여줌 */}
          {isEmailSent && (
            <div className="signup-input-group">
              <div className="signup-input-row">
                <input
                  type="text"
                  className={`signup-input ${errors.verifyCode ? 'error' : ''}`}
                  placeholder="인증번호 6자리"
                  value={verifyCode}
                  onChange={(e) => {
                    setVerifyCode(e.target.value);
                    setErrors((prev) => ({ ...prev, verifyCode: '' }));
                  }}
                  /* 인증 완료되면 수정 못하게 잠금 */
                  disabled={isVerified}
                />
                {/* 타이머 만료 전: 확인 버튼 / 만료 후: 재전송 버튼 */}
                {!isVerified && timeLeft <= 0 ? (
                  <button type="button" className="signup-side-btn" onClick={handleResendEmail}>
                    재전송
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`signup-side-btn ${isVerified ? 'done' : ''}`}
                    onClick={handleVerifyCode}
                    disabled={isVerified}
                  >
                    {isVerified ? '인증완료' : '확인'}
                  </button>
                )}
              </div>
              {/* 타이머: 인증번호 입력칸 아래에 남은 시간 표시 */}
              {!isVerified && timeLeft > 0 && (
                <p style={{
                  fontSize: '13px', fontWeight: 700, margin: '6px 0 0',
                  color: timeLeft <= 30 ? '#ef4444' : '#c96442',
                }}>
                  남은 시간 {formatTime(timeLeft)}
                </p>
              )}
              {errors.verifyCode && <p className="signup-error">{errors.verifyCode}</p>}
              {isVerified && (
                <p className="signup-success">이메일 인증이 완료되었습니다.</p>
              )}
            </div>
          )}

          {/* ───── 비밀번호 입력 ───── */}
          <div className="signup-input-group">
            <input
              type="password"
              className={`signup-input ${errors.password ? 'error' : ''}`}
              placeholder="비밀번호 (영문+숫자+특수문자 8~20자)"
              value={password}
              onChange={handlePasswordChange}
            />
            {errors.password && <p className="signup-error">{errors.password}</p>}
          </div>

          {/* ───── 비밀번호 재확인 입력 ───── */}
          <div className="signup-input-group">
            <input
              type="password"
              className={`signup-input ${errors.passwordConfirm ? 'error' : ''}`}
              placeholder="비밀번호 재확인"
              value={passwordConfirm}
              onChange={handlePasswordConfirmChange}
            />
            {errors.passwordConfirm && <p className="signup-error">{errors.passwordConfirm}</p>}
            {passwordConfirm && !errors.passwordConfirm && (
              <p className="signup-success">비밀번호가 일치합니다.</p>
            )}
          </div>

          {/* ───── 이름 입력 ───── */}
          <div className="signup-input-group">
            <input
              type="text"
              className={`signup-input ${errors.name ? 'error' : ''}`}
              placeholder="이름 (실명)"
              value={name}
              onChange={handleNameChange}
            />
            {errors.name && <p className="signup-error">{errors.name}</p>}
          </div>

          {/* ───── 닉네임 입력 + 중복확인 버튼 ───── */}
          <div className="signup-input-group">
            <div className="signup-input-row">
              <input
                type="text"
                className={`signup-input ${errors.nickname ? 'error' : ''}`}
                placeholder="닉네임 (한글, 영문, 숫자 2~12자)"
                value={nickname}
                onChange={handleNicknameChange}
              />
              <button
                type="button"
                className={`signup-side-btn ${isNicknameChecked ? 'done' : ''}`}
                onClick={handleCheckNickname}
                disabled={isNicknameChecked}
              >
                {isNicknameChecked ? '확인완료' : '중복확인'}
              </button>
            </div>
            {errors.nickname && <p className="signup-error">{errors.nickname}</p>}
            {isNicknameChecked && !errors.nickname && (
              <p className="signup-success">사용 가능한 닉네임입니다.</p>
            )}
          </div>

          {/* ───── 전체 에러 메시지 ───── */}
          {errors.general && (
            <p className="signup-error signup-general-error">{errors.general}</p>
          )}

          {/* ───── 가입하기 버튼 ───── */}
          {/* isSubmitting이 true면 로딩 중 표시 */}
          <button
            type="submit"
            className="signup-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? '가입 중...' : '가입하기'}
          </button>

        </form>

        {/* --- 이미 계정이 있으면 로그인으로 --- */}
        <p className="signup-login-link">
          이미 계정이 있으신가요?{' '}
          <span onClick={() => navigate('/login')}>로그인</span>
        </p>

        {/* --- 소셜 가입 구분선 ("or") --- */}
        <div className="signup-divider">
          <span>or</span>
        </div>

        {/* --- 소셜 가입 버튼들 --- */}
        <div className="signup-social">
          {/* 네이버 계정으로 가입 */}
          <button className="social-signup-btn naver-signup-btn" onClick={handleNaverSignup}>
            네이버 계정으로 가입하기
          </button>
          {/* 카카오 계정으로 가입 */}
          <button className="social-signup-btn kakao-signup-btn" onClick={handleKakaoSignup}>
            카카오 계정으로 가입하기
          </button>
        </div>

      </div>
    </div>
  );
}
