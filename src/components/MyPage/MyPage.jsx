/* ===================================================
   MyPage 컴포넌트 (마이페이지)
   - 로그인한 사용자의 개인 정보 관리 페이지
   - 프로필 카드: 아바타 + 이름 + 이메일 + 활동 통계
   - 탭 메뉴: 회원정보 / 내 코스 / 내 리뷰 / 좋아요 / 스크랩 / 내 질문
   - 회원정보 탭: 닉네임 수정 + 비밀번호 변경 + 저장 + 회원탈퇴
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserInfo,
  updateUserInfo,
  changePassword,
  deleteAccount,
} from '../../api/api';
import './MyPage.css';

export default function MyPage() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  const [activeTab, setActiveTab] = useState('회원정보'); /* 현재 선택된 탭 */
  const [user, setUser] = useState(null);                 /* 사용자 정보 (서버에서 가져옴) */
  const [nickname, setNickname] = useState('');            /* 닉네임 수정용 */
  const [currentPw, setCurrentPw] = useState('');          /* 현재 비밀번호 */
  const [newPw, setNewPw] = useState('');                  /* 새 비밀번호 */
  const [deletePw, setDeletePw] = useState('');            /* 탈퇴용 비밀번호 */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); /* 탈퇴 확인창 표시? */
  const [message, setMessage] = useState('');              /* 성공 메시지 */
  const [error, setError] = useState('');                  /* 에러 메시지 */

  /* --- 탭 메뉴 목록 --- */
  const tabs = ['회원정보', '내 코스', '내 리뷰', '좋아요', '스크랩', '내 질문'];

  /* --- 페이지 로딩 시 사용자 정보 가져오기 --- */
  useEffect(() => {
    /* localStorage에서 로그인한 사용자 정보 가져오기 */
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      /* 로그인 안 한 상태면 로그인 페이지로 보냄 */
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(savedUser);

    /* 서버에서 최신 사용자 정보 가져오기 */
    getUserInfo(parsed.userNum)
      .then((data) => {
        setUser(data);
        setNickname(data.NICKNAME || '');
      })
      .catch(() => {
        /* 서버에서 정보를 못 가져오면 localStorage 데이터 사용 */
        setUser(parsed);
        setNickname(parsed.nickname || '');
      });
  }, [navigate]);

  /* --- 닉네임 저장하기 버튼 클릭 --- */
  const handleSave = async () => {
    setMessage('');
    setError('');

    if (!nickname || nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    try {
      const userNum = user.USER_NUM || user.userNum;
      await updateUserInfo(userNum, { nickname });

      /* localStorage도 업데이트 */
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.nickname = nickname;
      localStorage.setItem('user', JSON.stringify(savedUser));

      setMessage('닉네임이 수정되었습니다.');
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- 비밀번호 변경 버튼 클릭 --- */
  const handleChangePassword = async () => {
    setMessage('');
    setError('');

    if (!currentPw || !newPw) {
      setError('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (newPw.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    try {
      const userNum = user.USER_NUM || user.userNum;
      await changePassword(userNum, currentPw, newPw);
      setMessage('비밀번호가 변경되었습니다.');
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- 회원탈퇴 버튼 클릭 --- */
  const handleDeleteAccount = async () => {
    setError('');

    if (!deletePw) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const userNum = user.USER_NUM || user.userNum;
      await deleteAccount(userNum, deletePw);

      /* localStorage 삭제 후 메인 페이지로 이동 */
      localStorage.removeItem('user');
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- 사용자 정보가 아직 안 불러와졌으면 로딩 표시 --- */
  if (!user) {
    return <div className="mypage"><p>로딩 중...</p></div>;
  }

  /* --- 사용자 이름/이메일 가져오기 (서버 데이터 or localStorage 데이터) --- */
  const userName = user.NAME || user.name || '사용자';
  const userEmail = user.EMAIL || user.email || '';
  const userNickname = user.NICKNAME || user.nickname || userName;

  return (
    <div className="mypage">

      {/* ===== 페이지 제목 ===== */}
      <h1 className="mypage-title">마이페이지</h1>

      {/* ===== 프로필 카드 ===== */}
      <div className="mypage-profile">
        {/* 프로필 사진 (원형) */}
        <div className="mypage-avatar">
          <span>{userNickname[0]}</span>
        </div>
        {/* 프로필 텍스트 정보 */}
        <div className="mypage-profile-info">
          <h2 className="mypage-name">{userNickname}</h2>
          <p className="mypage-email">{userEmail}</p>
        </div>
      </div>

      {/* ===== 탭 메뉴 ===== */}
      <div className="mypage-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`mypage-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setMessage(''); setError(''); }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== 탭 내용 영역 ===== */}
      <div className="mypage-content">

        {/* --- 회원정보 탭 --- */}
        {activeTab === '회원정보' && (
          <div className="mypage-info-section">

            {/* ── 닉네임 수정 ── */}
            <h3 className="mypage-section-title">닉네임 수정</h3>
            <div className="mypage-field">
              <label className="mypage-label">닉네임</label>
              <input
                type="text"
                className="mypage-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <button className="mypage-save-btn" onClick={handleSave}>
              닉네임 저장
            </button>

            {/* ── 구분선 ── */}
            <hr className="mypage-divider" />

            {/* ── 비밀번호 변경 ── */}
            <h3 className="mypage-section-title">비밀번호 변경</h3>
            <div className="mypage-field">
              <label className="mypage-label">현재 비밀번호</label>
              <input
                type="password"
                className="mypage-input"
                placeholder="현재 비밀번호 입력"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="mypage-field">
              <label className="mypage-label">새 비밀번호</label>
              <input
                type="password"
                className="mypage-input"
                placeholder="새 비밀번호 입력 (8자 이상)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <button className="mypage-save-btn" onClick={handleChangePassword}>
              비밀번호 변경
            </button>

            {/* ── 성공/에러 메시지 ── */}
            {message && <p className="mypage-message success">{message}</p>}
            {error && <p className="mypage-message error">{error}</p>}

            {/* ── 구분선 ── */}
            <hr className="mypage-divider" />

            {/* ── 회원 탈퇴 ── */}
            {!showDeleteConfirm ? (
              /* 탈퇴 링크: 클릭하면 확인창 표시 */
              <p
                className="mypage-delete-account"
                onClick={() => setShowDeleteConfirm(true)}
              >
                회원 탈퇴
              </p>
            ) : (
              /* 탈퇴 확인창: 비밀번호 입력 후 탈퇴 */
              <div className="mypage-delete-section">
                <p className="mypage-delete-warning">
                  정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.
                </p>
                <input
                  type="password"
                  className="mypage-input"
                  placeholder="비밀번호를 입력해주세요"
                  value={deletePw}
                  onChange={(e) => setDeletePw(e.target.value)}
                />
                <div className="mypage-delete-btns">
                  <button className="mypage-delete-btn" onClick={handleDeleteAccount}>
                    탈퇴하기
                  </button>
                  <button
                    className="mypage-cancel-btn"
                    onClick={() => { setShowDeleteConfirm(false); setDeletePw(''); }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 내 코스 탭 --- */}
        {/* 내가 만든 빵지순례 코스 목록 */}
        {/* 나중에 백엔드 API에서 내 코스 데이터를 가져올 예정 */}
        {activeTab === '내 코스' && (
          <div className="mypage-tab-section">
            {/* 더미 데이터: 내가 만든 코스 (나중에 API로 교체) */}
            {[
              { id: 1, title: '연남동 빵지순례 코스', placeCount: 4, likes: 23, date: '2026-03-10' },
              { id: 2, title: '을지로 레트로 빵투어', placeCount: 5, likes: 45, date: '2026-03-05' },
            ].length > 0 ? (
              <div className="my-card-list">
                {[
                  { id: 1, title: '연남동 빵지순례 코스', placeCount: 4, likes: 23, date: '2026-03-10' },
                  { id: 2, title: '을지로 레트로 빵투어', placeCount: 5, likes: 45, date: '2026-03-05' },
                ].map((course) => (
                  <div
                    key={course.id}
                    className="my-card"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    {/* 카드 왼쪽: 썸네일 이미지 */}
                    <div className="my-card-thumb">🍞</div>
                    {/* 카드 가운데: 코스 정보 */}
                    <div className="my-card-info">
                      <span className="my-card-title">{course.title}</span>
                      <span className="my-card-meta">
                        📍 {course.placeCount}곳 · ❤️ {course.likes} · {course.date}
                      </span>
                    </div>
                    {/* 카드 오른쪽: 수정/삭제 버튼 */}
                    <div className="my-card-actions">
                      <button
                        className="my-card-edit-btn"
                        onClick={(e) => { e.stopPropagation(); /* 나중에 수정 기능 */ }}
                      >
                        수정
                      </button>
                      <button
                        className="my-card-delete-btn"
                        onClick={(e) => { e.stopPropagation(); /* 나중에 삭제 기능 */ }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 코스가 없을 때 빈 상태 메시지 */
              <div className="mypage-empty">
                <span className="mypage-empty-icon">🗺️</span>
                <p className="mypage-empty-title">아직 만든 코스가 없어요</p>
                <p className="mypage-empty-desc">나만의 빵지순례 코스를 만들어보세요!</p>
                <button className="mypage-empty-btn" onClick={() => navigate('/create')}>
                  코스 만들기
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 내 리뷰 탭 --- */}
        {/* 내가 작성한 빵집 리뷰 목록 */}
        {activeTab === '내 리뷰' && (
          <div className="mypage-tab-section">
            {[
              { id: 1, shopName: '밀도', rating: 5, content: '식빵이 정말 부드럽고 맛있어요! 밤식빵 강추합니다.', date: '2026-03-12' },
              { id: 2, shopName: '베이커리 루이', rating: 4, content: '소금빵이 바삭하고 짭짤해서 좋았어요.', date: '2026-03-08' },
              { id: 3, shopName: '태극당', rating: 5, content: '모나카 아이스크림은 전설이에요. 야채샐러드빵도 맛있음!', date: '2026-03-01' },
            ].length > 0 ? (
              <div className="my-card-list">
                {[
                  { id: 1, shopName: '밀도', rating: 5, content: '식빵이 정말 부드럽고 맛있어요! 밤식빵 강추합니다.', date: '2026-03-12' },
                  { id: 2, shopName: '베이커리 루이', rating: 4, content: '소금빵이 바삭하고 짭짤해서 좋았어요.', date: '2026-03-08' },
                  { id: 3, shopName: '태극당', rating: 5, content: '모나카 아이스크림은 전설이에요. 야채샐러드빵도 맛있음!', date: '2026-03-01' },
                ].map((review) => (
                  <div key={review.id} className="my-card">
                    {/* 카드 왼쪽: 빵집 아이콘 */}
                    <div className="my-card-thumb">🍞</div>
                    {/* 카드 가운데: 리뷰 정보 */}
                    <div className="my-card-info">
                      <div className="my-review-top">
                        <span className="my-card-title">{review.shopName}</span>
                        <span className="my-review-stars">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      <p className="my-review-content">{review.content}</p>
                      <span className="my-card-meta">{review.date}</span>
                    </div>
                    {/* 카드 오른쪽: 삭제 버튼 */}
                    <div className="my-card-actions">
                      <button className="my-card-delete-btn">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mypage-empty">
                <span className="mypage-empty-icon">✏️</span>
                <p className="mypage-empty-title">아직 작성한 리뷰가 없어요</p>
                <p className="mypage-empty-desc">빵집을 방문하고 리뷰를 남겨보세요!</p>
              </div>
            )}
          </div>
        )}

        {/* --- 좋아요 탭 --- */}
        {/* 좋아요 누른 코스 목록 */}
        {activeTab === '좋아요' && (
          <div className="mypage-tab-section">
            {[
              { id: 3, title: '성수동 디저트 산책', author: '디저트러버', likes: 178, placeCount: 3 },
              { id: 4, title: '종로 전통 빵집 투어', author: '빵매니아', likes: 356, placeCount: 4 },
            ].length > 0 ? (
              <div className="my-card-list">
                {[
                  { id: 3, title: '성수동 디저트 산책', author: '디저트러버', likes: 178, placeCount: 3 },
                  { id: 4, title: '종로 전통 빵집 투어', author: '빵매니아', likes: 356, placeCount: 4 },
                ].map((course) => (
                  <div
                    key={course.id}
                    className="my-card"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="my-card-thumb">🍞</div>
                    <div className="my-card-info">
                      <span className="my-card-title">{course.title}</span>
                      <span className="my-card-meta">
                        by {course.author} · 📍 {course.placeCount}곳 · ❤️ {course.likes}
                      </span>
                    </div>
                    {/* 좋아요 취소 버튼 */}
                    <div className="my-card-actions">
                      <button
                        className="my-card-unlike-btn"
                        onClick={(e) => { e.stopPropagation(); /* 나중에 좋아요 취소 API */ }}
                      >
                        ❤️ 취소
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mypage-empty">
                <span className="mypage-empty-icon">❤️</span>
                <p className="mypage-empty-title">좋아요한 코스가 없어요</p>
                <p className="mypage-empty-desc">마음에 드는 코스에 좋아요를 눌러보세요!</p>
                <button className="mypage-empty-btn" onClick={() => navigate('/courses')}>
                  코스 둘러보기
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 스크랩 탭 --- */}
        {/* 스크랩(저장)한 코스 목록 */}
        {activeTab === '스크랩' && (
          <div className="mypage-tab-section">
            {[
              { id: 1, title: '연남동 빵지순례 코스', author: '빵순이', scraps: 89, placeCount: 4 },
              { id: 6, title: '압구정 프리미엄 디저트', author: '스위트걸', scraps: 98, placeCount: 4 },
            ].length > 0 ? (
              <div className="my-card-list">
                {[
                  { id: 1, title: '연남동 빵지순례 코스', author: '빵순이', scraps: 89, placeCount: 4 },
                  { id: 6, title: '압구정 프리미엄 디저트', author: '스위트걸', scraps: 98, placeCount: 4 },
                ].map((course) => (
                  <div
                    key={course.id}
                    className="my-card"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="my-card-thumb">🍞</div>
                    <div className="my-card-info">
                      <span className="my-card-title">{course.title}</span>
                      <span className="my-card-meta">
                        by {course.author} · 📍 {course.placeCount}곳 · 🔖 {course.scraps}
                      </span>
                    </div>
                    {/* 스크랩 취소 버튼 */}
                    <div className="my-card-actions">
                      <button
                        className="my-card-unscrap-btn"
                        onClick={(e) => { e.stopPropagation(); /* 나중에 스크랩 취소 API */ }}
                      >
                        🔖 취소
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mypage-empty">
                <span className="mypage-empty-icon">🔖</span>
                <p className="mypage-empty-title">스크랩한 코스가 없어요</p>
                <p className="mypage-empty-desc">나중에 보고 싶은 코스를 스크랩해보세요!</p>
                <button className="mypage-empty-btn" onClick={() => navigate('/courses')}>
                  코스 둘러보기
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 내 질문 탭 --- */}
        {/* 커뮤니티에 올린 질문 목록 */}
        {activeTab === '내 질문' && (
          <div className="mypage-tab-section">
            {[
              { id: 1, title: '연남동에서 소금빵 맛있는 곳 추천해주세요!', answers: 5, date: '2026-03-15', status: '답변완료' },
              { id: 2, title: '글루텐프리 빵집 아시는 분?', answers: 2, date: '2026-03-11', status: '답변완료' },
              { id: 3, title: '빵지순례 코스 추천 부탁드려요 (강남 쪽)', answers: 0, date: '2026-03-18', status: '답변대기' },
            ].length > 0 ? (
              <div className="my-card-list">
                {[
                  { id: 1, title: '연남동에서 소금빵 맛있는 곳 추천해주세요!', answers: 5, date: '2026-03-15', status: '답변완료' },
                  { id: 2, title: '글루텐프리 빵집 아시는 분?', answers: 2, date: '2026-03-11', status: '답변완료' },
                  { id: 3, title: '빵지순례 코스 추천 부탁드려요 (강남 쪽)', answers: 0, date: '2026-03-18', status: '답변대기' },
                ].map((question) => (
                  <div
                    key={question.id}
                    className="my-card"
                    onClick={() => navigate(`/community`)}
                  >
                    {/* 카드 왼쪽: 질문 아이콘 */}
                    <div className="my-card-thumb my-card-thumb-question">💬</div>
                    {/* 카드 가운데: 질문 정보 */}
                    <div className="my-card-info">
                      <span className="my-card-title">{question.title}</span>
                      <span className="my-card-meta">
                        💬 답변 {question.answers}개 · {question.date}
                      </span>
                    </div>
                    {/* 카드 오른쪽: 답변 상태 뱃지 */}
                    <div className="my-card-actions">
                      <span className={`my-question-status ${question.status === '답변완료' ? 'answered' : 'waiting'}`}>
                        {question.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mypage-empty">
                <span className="mypage-empty-icon">💬</span>
                <p className="mypage-empty-title">아직 작성한 질문이 없어요</p>
                <p className="mypage-empty-desc">궁금한 점이 있으면 커뮤니티에 질문해보세요!</p>
                <button className="mypage-empty-btn" onClick={() => navigate('/community')}>
                  커뮤니티 가기
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
