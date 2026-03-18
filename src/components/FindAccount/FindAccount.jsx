/* ===================================================
   FindAccount 컴포넌트 (아이디/비밀번호 찾기)
   - 아이디/비밀번호 찾기 페이지의 메인 영역
   - 상단에 탭 2개: "아이디 찾기" / "비밀번호 찾기"
   - 탭을 클릭하면 해당 탭 내용으로 전환
   - 이메일 입력 + 인증번호 전송 버튼
   - 인증번호 입력 + 확인 버튼
   - 아이디 찾기 (또는 비밀번호 찾기) 제출 버튼
   =================================================== */

import { useState } from 'react';
import './FindAccount.css';

export default function FindAccount() {

  /* --- 상태(state) 관리 --- */
  // activeTab: 현재 선택된 탭 ("id" = 아이디 찾기, "pw" = 비밀번호 찾기)
  const [activeTab, setActiveTab] = useState('id');

  // 이메일 주소 입력값
  const [email, setEmail] = useState('');
  // 인증번호 입력값
  const [verifyCode, setVerifyCode] = useState('');

  // 인증번호 전송 완료 여부
  const [isCodeSent, setIsCodeSent] = useState(false);
  // 인증 확인 완료 여부
  const [isVerified, setIsVerified] = useState(false);

  /* --- 탭 전환 시 입력값 초기화 --- */
  // 탭을 바꿀 때 이전에 입력한 값들을 깨끗하게 지워줌
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail('');
    setVerifyCode('');
    setIsCodeSent(false);
    setIsVerified(false);
  };

  /* --- 인증번호 전송 버튼 클릭 --- */
  const handleSendCode = () => {
    if (!email) return;
    console.log('인증번호 전송:', email);
    setIsCodeSent(true);
  };

  /* --- 인증번호 확인 버튼 클릭 --- */
  const handleVerifyCode = () => {
    if (!verifyCode) return;
    console.log('인증번호 확인:', verifyCode);
    setIsVerified(true);
  };

  /* --- 제출 버튼 클릭 (아이디 찾기 or 비밀번호 찾기) --- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'id') {
      console.log('아이디 찾기 요청:', { email, verifyCode });
    } else {
      console.log('비밀번호 찾기 요청:', { email, verifyCode });
    }
  };

  return (
    <div className="find-wrapper">
      {/* ===== 찾기 카드 ===== */}
      <div className="find-card">

        {/* --- 제목 --- */}
        <h2 className="find-title">아이디 / 비밀번호 찾기</h2>

        {/* --- 탭 메뉴 --- */}
        {/* 아이디 찾기 / 비밀번호 찾기 탭을 클릭해서 전환 */}
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

          {/* 이메일 주소 + 인증번호 전송 버튼 */}
          <div className="find-input-group find-input-row">
            <input
              type="email"
              className="find-input"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              className={`find-side-btn ${isCodeSent ? 'done' : ''}`}
              onClick={handleSendCode}
            >
              {isCodeSent ? '전송완료' : '인증번호 전송'}
            </button>
          </div>

          {/* 인증번호 입력 + 확인 버튼 */}
          <div className="find-input-group find-input-row">
            <input
              type="text"
              className="find-input"
              placeholder="인증번호 입력"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
            <button
              type="button"
              className={`find-side-btn ${isVerified ? 'done' : ''}`}
              onClick={handleVerifyCode}
            >
              {isVerified ? '인증완료' : '확인'}
            </button>
          </div>

          {/* 제출 버튼: 탭에 따라 텍스트가 바뀜 */}
          <button type="submit" className="find-submit-btn">
            {activeTab === 'id' ? '아이디 찾기' : '비밀번호 찾기'}
          </button>

        </form>

      </div>
    </div>
  );
}
