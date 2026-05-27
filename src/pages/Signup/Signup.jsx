import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signup,
  checkIdDuplicate,
  checkNicknameDuplicate,
  sendEmailVerification,
  verifyEmailCode,
} from '../../api/apiAxios';
import './Signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);

  const [emailUsername, setEmailUsername] = useState('');
  const [emailDomain, setEmailDomain] = useState('gmail.com');
  const [customDomain, setCustomDomain] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agrees, setAgrees] = useState([false, false, false]);

  const [nickname, setNickname] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getFullEmail = () => {
    const domain = emailDomain === 'direct' ? customDomain : emailDomain;
    return emailUsername && domain ? `${emailUsername}@${domain}` : '';
  };

  const getPasswordStrength = (pw) => {
    if (!pw || pw.length < 8) return 0;
    let score = 1;
    if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score = 2;
    if (score === 2 && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score = 3;
    return score;
  };

  const validateUserId = (value) => {
    if (!value) return '아이디를 입력해주세요.';
    if (value.length < 4) return '아이디는 4자 이상이어야 합니다.';
    if (value.length > 20) return '아이디는 20자 이하여야 합니다.';
    if (!/^[a-zA-Z0-9]+$/.test(value)) return '아이디는 영문, 숫자만 사용할 수 있습니다.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return '비밀번호를 입력해주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (value.length > 16) return '비밀번호는 16자 이하여야 합니다.';
    if (!/[a-zA-Z]/.test(value)) return '비밀번호에 영문자를 포함해주세요.';
    if (!/[0-9]/.test(value)) return '비밀번호에 숫자를 포함해주세요.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return '비밀번호에 특수문자를 포함해주세요.';
    return '';
  };

  const validatePasswordConfirm = (value) => {
    if (!value) return '비밀번호를 다시 입력해주세요.';
    if (value !== password) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  const validateEmail = () => {
    const email = getFullEmail();
    if (!email) return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  };

  const validateNickname = (value) => {
    if (!value) return '닉네임을 입력해주세요.';
    if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.';
    if (value.length > 12) return '닉네임은 12자 이하여야 합니다.';
    if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) return '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
    return '';
  };

  const handleSendEmail = async () => {
    const error = validateEmail();
    if (error) { setErrors(prev => ({ ...prev, email: error })); return; }
    try {
      await sendEmailVerification(getFullEmail());
      setIsEmailSent(true);
      setTimeLeft(180);
      setErrors(prev => ({ ...prev, email: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, email: err.message }));
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCode) { setErrors(prev => ({ ...prev, verifyCode: '인증번호를 입력해주세요.' })); return; }
    if (timeLeft <= 0) { setErrors(prev => ({ ...prev, verifyCode: '인증 시간이 만료되었습니다.' })); return; }
    try {
      await verifyEmailCode(getFullEmail(), verifyCode);
      setIsVerified(true);
      clearTimeout(timerRef.current);
      setErrors(prev => ({ ...prev, verifyCode: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, verifyCode: err.message }));
    }
  };

  const handleResendEmail = async () => {
    try {
      await sendEmailVerification(getFullEmail());
      setTimeLeft(180);
      setVerifyCode('');
      setErrors(prev => ({ ...prev, email: '', verifyCode: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, email: err.message }));
    }
  };

  const handleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgrees([next, next, next]);
  };

  const handleAgreeItem = (index) => {
    const next = [...agrees];
    next[index] = !next[index];
    setAgrees(next);
    setAgreeAll(next.every(Boolean));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'jpg, png 파일만 업로드 가능합니다.' }));
      return;
    }
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const handleImageReset = () => {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNext = async () => {
    if (step === 1) {
      const newErrors = {};
      newErrors.userId = validateUserId(userId);
      newErrors.password = validatePassword(password);
      newErrors.passwordConfirm = validatePasswordConfirm(passwordConfirm);

      if (!newErrors.userId && !isIdChecked) {
        try {
          await checkIdDuplicate(userId);
          setIsIdChecked(true);
        } catch (err) {
          newErrors.userId = err.message;
        }
      }

      setErrors(newErrors);
      if (Object.values(newErrors).some(e => e)) return;
      setStep(2);
    } else if (step === 2) {
      const newErrors = {};
      newErrors.email = validateEmail();
      if (!newErrors.email && !isVerified) newErrors.email = '이메일 인증을 완료해주세요.';
      if (!agrees[0] || !agrees[1]) newErrors.agree = '필수 약관에 동의해주세요.';
      setErrors(newErrors);
      if (Object.values(newErrors).some(e => e)) return;
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    newErrors.nickname = validateNickname(nickname);

    if (!newErrors.nickname && !isNicknameChecked) {
      try {
        await checkNicknameDuplicate(nickname);
        setIsNicknameChecked(true);
      } catch (err) {
        newErrors.nickname = err.message;
      }
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e)) return;

    setIsSubmitting(true);
    try {
      await signup({
        id: userId,
        password: password,
        name: nickname,
        nickname: nickname,
        email: getFullEmail(),
      });
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setErrors(prev => ({ ...prev, general: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['', '취약', '적정', '안전'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#22c55e'];

  const domainOptions = [
    { value: 'gmail.com', label: 'gmail.com' },
    { value: 'naver.com', label: 'naver.com' },
    { value: 'daum.net', label: 'daum.net' },
    { value: 'hanmail.net', label: 'hanmail.net' },
    { value: 'direct', label: '직접입력' },
  ];

  const agreeLabels = [
    { text: '이용약관 동의', required: true },
    { text: '개인정보 수집 및 이용 동의', required: true },
    { text: '마케팅 정보 수신 동의', required: false },
  ];

  const steps = [
    { num: 1, label: '정보' },
    { num: 2, label: '인증' },
    { num: 3, label: '프로필' },
  ];

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-stepper">
          {steps.map((s, i) => (
            <div key={s.num} className={`signup-step ${step >= s.num ? 'active' : ''} ${step === s.num ? 'current' : ''}`}>
              {i > 0 && <div className={`signup-step-line ${step > i ? 'active' : ''}`} />}
              <div className="signup-step-circle">{s.num}</div>
              <span className="signup-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        <h1 className="signup-title">회원가입</h1>

        {step === 1 && (
          <div className="signup-step-content">
            <div className="signup-field">
              <label className="signup-label">아이디</label>
              <div className="signup-input-wrap">
                <input
                  type="text"
                  className={`signup-input ${errors.userId ? 'error' : ''}`}
                  placeholder="영문, 숫자 4~20자"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setIsIdChecked(false);
                    setErrors(prev => ({ ...prev, userId: '' }));
                  }}
                  onBlur={async () => {
                    if (!userId) return;
                    const error = validateUserId(userId);
                    if (error) { setErrors(prev => ({ ...prev, userId: error })); return; }
                    try {
                      await checkIdDuplicate(userId);
                      setIsIdChecked(true);
                      setErrors(prev => ({ ...prev, userId: '' }));
                    } catch (err) {
                      setErrors(prev => ({ ...prev, userId: err.message }));
                    }
                  }}
                />
                {userId && (
                  <button type="button" className="signup-clear-btn" onClick={() => { setUserId(''); setIsIdChecked(false); }}>
                    <i className="fi fi-rs-cross-small"></i>
                  </button>
                )}
              </div>
              {errors.userId && <p className="signup-error">{errors.userId}</p>}
              {isIdChecked && !errors.userId && <p className="signup-success">사용할 수 있는 아이디입니다.</p>}
            </div>

            <div className="signup-field">
              <label className="signup-label">비밀번호</label>
              <div className="signup-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`signup-input ${errors.password ? 'error' : ''}`}
                  placeholder="8~16자의 영문 대소문자, 숫자, 특수문자"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({
                      ...prev,
                      password: '',
                      passwordConfirm: passwordConfirm && e.target.value !== passwordConfirm ? '비밀번호가 일치하지 않습니다.' : '',
                    }));
                  }}
                />
                <button type="button" className="signup-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  <i className={showPassword ? 'fi fi-rs-eye' : 'fi fi-rs-crossed-eye'}></i>
                </button>
              </div>
              {password && (
                <div className="signup-strength">
                  {passwordStrength > 0 && (
                    <span className="signup-strength-label" style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  )}
                  <div className="signup-strength-bar">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className="signup-strength-segment"
                        style={{ background: passwordStrength >= level ? strengthColors[passwordStrength] : '#e0e0e0' }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <p className="signup-helper">8~16자의 영문 대소문자, 숫자, 특수문자만 가능합니다.</p>
              {errors.password && <p className="signup-error">{errors.password}</p>}
            </div>

            <div className="signup-field">
              <label className="signup-label">비밀번호 확인</label>
              <div className="signup-input-wrap">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  className={`signup-input ${errors.passwordConfirm ? 'error' : ''}`}
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    setErrors(prev => ({
                      ...prev,
                      passwordConfirm: e.target.value && e.target.value !== password ? '비밀번호가 일치하지 않습니다.' : '',
                    }));
                  }}
                />
                <button type="button" className="signup-eye-btn" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} tabIndex={-1}>
                  <i className={showPasswordConfirm ? 'fi fi-rs-eye' : 'fi fi-rs-crossed-eye'}></i>
                </button>
              </div>
              {errors.passwordConfirm && <p className="signup-error">{errors.passwordConfirm}</p>}
              {passwordConfirm && !errors.passwordConfirm && password === passwordConfirm && (
                <p className="signup-success">비밀번호가 일치합니다.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="signup-step-content">
            <div className="signup-field">
              <label className="signup-label">이메일</label>
              <div className="signup-email-row">
                <input
                  type="text"
                  className="signup-input signup-email-input"
                  placeholder="이메일"
                  value={emailUsername}
                  onChange={(e) => {
                    setEmailUsername(e.target.value);
                    setIsEmailSent(false);
                    setIsVerified(false);
                    setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  disabled={isVerified}
                />
                <span className="signup-email-at">@</span>
                {emailDomain === 'direct' ? (
                  <input
                    type="text"
                    className="signup-input signup-email-input"
                    placeholder="도메인 입력"
                    value={customDomain}
                    onChange={(e) => {
                      setCustomDomain(e.target.value);
                      setIsEmailSent(false);
                      setIsVerified(false);
                    }}
                    disabled={isVerified}
                  />
                ) : null}
                <select
                  className="signup-domain-select"
                  value={emailDomain}
                  onChange={(e) => {
                    setEmailDomain(e.target.value);
                    setIsEmailSent(false);
                    setIsVerified(false);
                  }}
                  disabled={isVerified}
                >
                  {domainOptions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {!isVerified && (
                  <button
                    type="button"
                    className={`signup-send-btn ${isEmailSent && timeLeft > 0 ? 'done' : ''}`}
                    onClick={handleSendEmail}
                    disabled={isVerified}
                  >
                    {isEmailSent && timeLeft > 0 ? '전송완료' : isEmailSent ? '재전송' : '인증번호 발송'}
                  </button>
                )}
              </div>
              {errors.email && <p className="signup-error">{errors.email}</p>}
              {isVerified && <p className="signup-success">이메일 인증이 완료되었습니다.</p>}
            </div>

            {isEmailSent && !isVerified && (
              <div className="signup-field">
                <div className="signup-verify-row">
                  <input
                    type="text"
                    className="signup-input signup-verify-input"
                    placeholder="인증번호 6자리"
                    value={verifyCode}
                    onChange={(e) => { setVerifyCode(e.target.value); setErrors(prev => ({ ...prev, verifyCode: '' })); }}
                  />
                  {timeLeft > 0 && (
                    <span className="signup-timer">{formatTime(timeLeft)}</span>
                  )}
                  {timeLeft <= 0 ? (
                    <button type="button" className="signup-verify-sm-btn" onClick={handleResendEmail}>재발송</button>
                  ) : (
                    <button type="button" className="signup-verify-sm-btn primary" onClick={handleVerifyCode}>확인</button>
                  )}
                </div>
                {errors.verifyCode && <p className="signup-error">{errors.verifyCode}</p>}
              </div>
            )}

            <div className="signup-field signup-agree-section">
              <div className="signup-agree-all" onClick={handleAgreeAll}>
                <div className={`signup-checkbox ${agreeAll ? 'checked' : ''}`}>
                  {agreeAll && <i className="fi fi-rs-check"></i>}
                </div>
                <span className="signup-agree-all-text">전체동의</span>
              </div>
              <div className="signup-agree-divider" />
              {agreeLabels.map((item, i) => (
                <div key={i} className="signup-agree-item">
                  <div className="signup-agree-left" onClick={() => handleAgreeItem(i)}>
                    <div className={`signup-checkbox ${agrees[i] ? 'checked' : ''}`}>
                      {agrees[i] && <i className="fi fi-rs-check"></i>}
                    </div>
                    <span>{item.required ? '[필수]' : '[선택]'} {item.text}</span>
                  </div>
                  <button type="button" className="signup-agree-detail">상세보기</button>
                </div>
              ))}
              {errors.agree && <p className="signup-error">{errors.agree}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="signup-step-content">
            <div className="signup-field signup-profile-section">
              <label className="signup-label">프로필 이미지</label>
              <div className="signup-profile-previews">
                <div className="signup-profile-circle large">
                  {profilePreview ? <img src={profilePreview} alt="profile" /> : <i className="fi fi-rs-user"></i>}
                </div>
                <div className="signup-profile-circle medium">
                  {profilePreview ? <img src={profilePreview} alt="profile" /> : <i className="fi fi-rs-user"></i>}
                </div>
                <div className="signup-profile-circle small">
                  {profilePreview ? <img src={profilePreview} alt="profile" /> : <i className="fi fi-rs-user"></i>}
                </div>
              </div>
              <div className="signup-profile-actions">
                <button type="button" className="signup-profile-btn" onClick={handleImageReset}>초기화</button>
                <button type="button" className="signup-profile-btn primary" onClick={() => fileInputRef.current?.click()}>업로드</button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>
              <p className="signup-helper">jpg, png 파일만 업로드 가능합니다.</p>
              {errors.profileImage && <p className="signup-error">{errors.profileImage}</p>}
            </div>

            <div className="signup-field">
              <label className="signup-label">닉네임</label>
              <div className="signup-input-wrap">
                <input
                  type="text"
                  className={`signup-input ${errors.nickname ? 'error' : ''}`}
                  placeholder="한글, 영문, 숫자 2~12자"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setIsNicknameChecked(false);
                    setErrors(prev => ({ ...prev, nickname: '' }));
                  }}
                  onBlur={async () => {
                    if (!nickname) return;
                    const error = validateNickname(nickname);
                    if (error) { setErrors(prev => ({ ...prev, nickname: error })); return; }
                    try {
                      await checkNicknameDuplicate(nickname);
                      setIsNicknameChecked(true);
                      setErrors(prev => ({ ...prev, nickname: '' }));
                    } catch (err) {
                      setErrors(prev => ({ ...prev, nickname: err.message }));
                    }
                  }}
                />
                {nickname && (
                  <button type="button" className="signup-clear-btn" onClick={() => { setNickname(''); setIsNicknameChecked(false); }}>
                    <i className="fi fi-rs-cross-small"></i>
                  </button>
                )}
              </div>
              {errors.nickname && <p className="signup-error">{errors.nickname}</p>}
              {isNicknameChecked && !errors.nickname && <p className="signup-success">사용할 수 있는 닉네임입니다.</p>}
            </div>

            {errors.general && (
              <div className="signup-general-error">{errors.general}</div>
            )}
          </div>
        )}

        <div className="signup-bottom-btns">
          {step === 1 ? (
            <>
              <button type="button" className="signup-bottom-btn cancel" onClick={() => navigate(-1)}>취소</button>
              <button type="button" className="signup-bottom-btn next" onClick={handleNext}>다음</button>
            </>
          ) : step === 2 ? (
            <>
              <button type="button" className="signup-bottom-btn cancel" onClick={handlePrev}>이전</button>
              <button type="button" className="signup-bottom-btn next" onClick={handleNext}>다음</button>
            </>
          ) : (
            <>
              <button type="button" className="signup-bottom-btn cancel" onClick={handlePrev}>이전</button>
              <button type="button" className="signup-bottom-btn next" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '가입 중...' : '완료'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
