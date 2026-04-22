/* ===================================================
   MyPage 컴포넌트 (마이페이지)
   - Oven 디자인: 사이드바(프로필+메뉴) + 콘텐츠 영역
   - 왼쪽: 프로필 카드 + 메뉴 버튼 목록
   - 오른쪽: 선택한 메뉴의 내용 (회원정보, 내 코스 등)
   - 백엔드 API 연동 (닉네임 수정, 비밀번호 변경, 회원탈퇴)
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserInfo,
  updateUserInfo,
  changePassword,
  deleteAccount,
  getMyCourses,
  getMyReviews,
  getLikedCourses,
  getScrapedCourses,
  getMyPosts,
  toggleCourseLike,
  toggleCourseScrap,
  deleteReview,
  getMyDrafts,
  deleteDraft,
} from '../../api/apiAxios';
import './MyPage.css';

export default function MyPage() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  /* 현재 선택된 메뉴 (사이드바에서 클릭한 메뉴) */
  const [activeMenu, setActiveMenu] = useState('courses');
  /* 사용자 정보 (서버에서 가져옴) */
  const [user, setUser] = useState(null);
  /* 닉네임 수정용 */
  const [nickname, setNickname] = useState('');
  /* 현재 비밀번호 */
  const [currentPw, setCurrentPw] = useState('');
  /* 새 비밀번호 */
  const [newPw, setNewPw] = useState('');
  /* 탈퇴용 비밀번호 */
  const [deletePw, setDeletePw] = useState('');
  /* 탈퇴 확인창 표시 여부 */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  /* 성공 메시지 */
  const [message, setMessage] = useState('');
  /* 에러 메시지 */
  const [error, setError] = useState('');

  /* --- 각 탭의 데이터 --- */
  const [myCourses, setMyCourses] = useState([]);       /* 내가 만든 코스 */
  const [myReviews, setMyReviews] = useState([]);       /* 내가 남긴 리뷰 */
  const [likedCourses, setLikedCourses] = useState([]); /* 좋아요한 코스 */
  const [scrapedCourses, setScrapedCourses] = useState([]); /* 스크랩한 코스 */
  const [myDrafts, setMyDrafts] = useState([]);         /* 임시저장한 코스 */
  const [myPosts, setMyPosts] = useState([]);           /* 내가 작성한 질문 */
  const [tabLoading, setTabLoading] = useState(false);  /* 탭 데이터 로딩 중? */

  /* --- 사이드바 메뉴 목록 --- */
  /* id: 내부 식별자, label: 화면에 보이는 텍스트, icon: 아이콘 이모지 */
  const menuItems = [
    { id: 'profile', label: '회원 정보 관리', icon: '👤' },
    { id: 'courses', label: '내가 만든 코스', icon: '🗺️' },
    { id: 'drafts', label: '임시저장', icon: '📝' },
    { id: 'reviews', label: '내가 남긴 리뷰', icon: '⭐' },
    { id: 'liked', label: '좋아요한 코스', icon: '❤️' },
    { id: 'scraped', label: '스크랩한 코스', icon: '🔖' },
    { id: 'qna', label: '내가 작성한 질문', icon: '💬' },
  ];

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

  /* --- 탭 변경 시 데이터 불러오기 --- */
  /* 메뉴를 클릭하면 해당 탭에 맞는 데이터를 서버에서 가져옴 */
  useEffect(() => {
    if (!user) return; /* 사용자 정보가 없으면 아직 로딩 중 */
    const userNum = user.USER_NUM || user.userNum;
    if (!userNum) return;

    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeMenu === 'courses') {
          const data = await getMyCourses(userNum);
          setMyCourses(data);
        } else if (activeMenu === 'drafts') {
          const data = await getMyDrafts(userNum);
          setMyDrafts(data);
        } else if (activeMenu === 'reviews') {
          const data = await getMyReviews(userNum);
          setMyReviews(data);
        } else if (activeMenu === 'liked') {
          const data = await getLikedCourses(userNum);
          setLikedCourses(data);
        } else if (activeMenu === 'scraped') {
          const data = await getScrapedCourses(userNum);
          setScrapedCourses(data);
        } else if (activeMenu === 'qna') {
          const data = await getMyPosts(userNum);
          setMyPosts(data);
        }
      } catch (err) {
        console.error('탭 데이터 로딩 실패:', err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeMenu, user]);

  /* --- 좋아요 취소 --- */
  const handleUnlike = async (courseNum) => {
    const userNum = user.USER_NUM || user.userNum;
    try {
      await toggleCourseLike(courseNum, userNum);
      /* 목록에서 제거 */
      setLikedCourses(prev => prev.filter(c => c.COURSE_NUM !== courseNum));
    } catch (err) {
      console.error('좋아요 취소 실패:', err);
    }
  };

  /* --- 스크랩 취소 --- */
  const handleUnscrap = async (courseNum) => {
    const userNum = user.USER_NUM || user.userNum;
    try {
      await toggleCourseScrap(courseNum, userNum);
      /* 목록에서 제거 */
      setScrapedCourses(prev => prev.filter(c => c.COURSE_NUM !== courseNum));
    } catch (err) {
      console.error('스크랩 취소 실패:', err);
    }
  };

  /* --- 임시저장 삭제 --- */
  const handleDeleteDraft = async (draftNum) => {
    if (!window.confirm('임시저장을 삭제하시겠습니까?')) return;
    try {
      await deleteDraft(draftNum);
      /* 목록에서 제거 */
      setMyDrafts(prev => prev.filter(d => d.DRAFT_NUM !== draftNum));
    } catch (err) {
      console.error('임시저장 삭제 실패:', err);
    }
  };

  /* --- 임시저장 이어서 작성하기 (코스 만들기 페이지로 데이터 전달) --- */
  const handleEditDraft = (draft) => {
    /* 임시저장된 커버 이미지 URL도 함께 넘김 */
    let coverImages = [];
    try {
      coverImages = typeof draft.COVER_IMAGES === 'string' ? JSON.parse(draft.COVER_IMAGES) : (draft.COVER_IMAGES || []);
    } catch { coverImages = []; }

    navigate('/create', {
      state: {
        draftNum: draft.DRAFT_NUM,
        title: draft.TITLE || '',
        description: draft.DESCRIPTION || '',
        tags: typeof draft.TAGS === 'string' ? JSON.parse(draft.TAGS) : (draft.TAGS || []),
        places: typeof draft.PLACES === 'string' ? JSON.parse(draft.PLACES) : (draft.PLACES || []),
        placeComments: typeof draft.PLACE_COMMENTS === 'string' ? JSON.parse(draft.PLACE_COMMENTS) : (draft.PLACE_COMMENTS || {}),
        coverImages,
      }
    });
  };

  /* --- 리뷰 삭제 --- */
  const handleDeleteReview = async (reviewNum) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
    const userNum = user.USER_NUM || user.userNum;
    try {
      await deleteReview(reviewNum, userNum);
      /* 목록에서 제거 */
      setMyReviews(prev => prev.filter(r => r.REVIEW_NUM !== reviewNum));
    } catch (err) {
      console.error('리뷰 삭제 실패:', err);
    }
  };

  /* --- 닉네임 저장하기 --- */
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
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.nickname = nickname;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setMessage('닉네임이 수정되었습니다.');
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- 비밀번호 변경 --- */
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

  /* --- 회원탈퇴 --- */
  /* 소셜 로그인 사용자인지 확인 (네이버/카카오는 비밀번호가 없음) */
  const isSocialUser = user?.SOCIAL_TYPE === 'naver' || user?.SOCIAL_TYPE === 'kakao' || user?.socialType === 'naver' || user?.socialType === 'kakao';

  const handleDeleteAccount = async () => {
    setError('');
    /* 일반 회원만 비밀번호 필요 (소셜 로그인은 비밀번호 없이 탈퇴) */
    if (!isSocialUser && !deletePw) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    try {
      const userNum = user.USER_NUM || user.userNum;
      await deleteAccount(userNum, isSocialUser ? null : deletePw);
      localStorage.removeItem('user');
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- 로그아웃 --- */
  const handleLogout = () => {
    localStorage.removeItem('user');
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  /* --- 로딩 중 --- */
  if (!user) {
    return <div className="mypage"><p>로딩 중...</p></div>;
  }

  /* --- 사용자 이름/이메일 가져오기 --- */
  const userName = user.NAME || user.name || '사용자';
  const userEmail = user.EMAIL || user.email || '';
  const userNickname = user.NICKNAME || user.nickname || userName;

  /* --- 현재 선택된 메뉴의 라벨 가져오기 --- */
  const currentLabel = menuItems.find((m) => m.id === activeMenu)?.label || '';

  return (
    <div className="mypage">
      <div className="mypage-container">
        <div className="mypage-layout">

          {/* ===== 왼쪽 사이드바 ===== */}
          <div className="mypage-sidebar">

            {/* --- 프로필 카드 --- */}
            <div className="mypage-profile">
              {/* 프로필 아바타 (닉네임 첫 글자) */}
              <div className="mypage-avatar">
                <span>{userNickname[0]}</span>
              </div>
              {/* 이름 + 이메일 */}
              <h2 className="mypage-name">{userNickname}</h2>
              <p className="mypage-email">{userEmail}</p>
              {/* 프로필 수정 버튼 (회원정보 탭으로 이동) */}
              <button
                className="mypage-profile-edit-btn"
                onClick={() => setActiveMenu('profile')}
              >
                프로필 수정
              </button>
            </div>

            {/* --- 메뉴 목록 --- */}
            <div className="mypage-menu">
              {/* 각 메뉴 버튼 */}
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`mypage-menu-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveMenu(item.id); setMessage(''); setError(''); }}
                >
                  <span className="mypage-menu-label">
                    <span className="mypage-menu-icon">{item.icon}</span>
                    {item.label}
                  </span>
                  {/* 선택된 메뉴에만 화살표 표시 */}
                  {activeMenu === item.id && <span className="mypage-menu-arrow">→</span>}
                </button>
              ))}
              {/* 구분선 */}
              <div className="mypage-menu-divider" />
              {/* 로그아웃 버튼 */}
              <button className="mypage-logout-btn" onClick={handleLogout}>
                🚪 로그아웃
              </button>
            </div>
          </div>

          {/* ===== 오른쪽 콘텐츠 영역 ===== */}
          <div className="mypage-content">
            {/* 콘텐츠 제목 (선택한 메뉴 이름) */}
            <h2 className="mypage-content-title">{currentLabel}</h2>

            {/* --- 회원 정보 관리 탭 --- */}
            {activeMenu === 'profile' && (
              <div className="mypage-info-section">
                {/* 닉네임 수정 */}
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

                <hr className="mypage-divider" />

                {/* 비밀번호 변경 */}
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

                {/* 성공/에러 메시지 */}
                {message && <p className="mypage-message success">{message}</p>}
                {error && <p className="mypage-message error">{error}</p>}

                <hr className="mypage-divider" />

                {/* 회원 탈퇴 */}
                {!showDeleteConfirm ? (
                  <p
                    className="mypage-delete-account"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    회원 탈퇴
                  </p>
                ) : (
                  <div className="mypage-delete-section">
                    <p className="mypage-delete-warning">
                      정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.
                    </p>
                    {/* 일반 회원만 비밀번호 입력 (소셜 로그인은 비밀번호 없이 탈퇴) */}
                    {!isSocialUser && (
                      <input
                        type="password"
                        className="mypage-input"
                        placeholder="비밀번호를 입력해주세요"
                        value={deletePw}
                        onChange={(e) => setDeletePw(e.target.value)}
                      />
                    )}
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

            {/* --- 내가 만든 코스 탭 --- */}
            {/* 그리드 레이아웃: 새 코스 만들기 카드 + 코스 카드들 */}
            {activeMenu === 'courses' && (
              <div className="my-card-grid">
                {/* 새 코스 만들기 카드 (항상 맨 앞에 표시) */}
                <div className="my-card-create" onClick={() => navigate('/create')}>
                  <span className="my-card-create-icon">🗺️</span>
                  <span className="my-card-create-text">새 코스 만들기</span>
                </div>
                {/* DB에서 가져온 내 코스 카드들 */}
                {tabLoading && <p style={{ color: '#999', padding: '20px' }}>불러오는 중...</p>}
                {myCourses.map((course) => (
                  <div
                    key={course.COURSE_NUM}
                    className="my-course-card"
                    onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                  >
                    {/* 코스 이미지 */}
                    <div className="my-course-card-img">
                      <div style={{ width: '100%', height: '100%', background: '#e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        🍞
                      </div>
                      {/* 공개 뱃지 */}
                      <span className="my-course-card-badge">공개</span>
                    </div>
                    {/* 코스 정보 */}
                    <div className="my-course-card-info">
                      <h3 className="my-course-card-title">{course.TITLE}</h3>
                      <p className="my-course-card-meta">
                        {new Date(course.CREATED_TIME).toLocaleDateString('ko-KR')} · 📍 {course.placeCount}곳 · ❤️ {course.likeCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- 임시저장 탭 --- */}
            {activeMenu === 'drafts' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : myDrafts.length > 0 ? (
                  <div className="my-card-list">
                    {myDrafts.map((draft) => {
                      /* JSON 문자열이면 파싱, 이미 객체면 그대로 사용 */
                      const draftPlaces = typeof draft.PLACES === 'string' ? JSON.parse(draft.PLACES) : (draft.PLACES || []);
                      return (
                        <div key={draft.DRAFT_NUM} className="my-card">
                          <div className="my-card-thumb">📝</div>
                          <div className="my-card-info">
                            <span className="my-card-title">
                              {draft.TITLE || '제목 없음'}
                            </span>
                            <span className="my-card-meta">
                              📍 {draftPlaces.length}곳 · {new Date(draft.UPDATED_TIME).toLocaleDateString('ko-KR')} 저장
                            </span>
                          </div>
                          <div className="my-card-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="mypage-save-btn"
                              style={{ padding: '6px 14px', fontSize: '12px', marginTop: 0 }}
                              onClick={() => handleEditDraft(draft)}
                            >
                              이어서 작성
                            </button>
                            <button
                              className="my-card-delete-btn"
                              onClick={() => handleDeleteDraft(draft.DRAFT_NUM)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mypage-empty">
                    <span className="mypage-empty-icon">📝</span>
                    <p className="mypage-empty-title">임시저장한 코스가 없어요</p>
                    <p className="mypage-empty-desc">코스 작성 중 임시저장하면 여기에 표시돼요!</p>
                    <button className="mypage-empty-btn" onClick={() => navigate('/create')}>
                      코스 만들기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- 내가 남긴 리뷰 탭 --- */}
            {activeMenu === 'reviews' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : myReviews.length > 0 ? (
                  <div className="my-card-list">
                    {myReviews.map((review) => (
                      <div key={review.REVIEW_NUM} className="my-card">
                        <div className="my-card-thumb">🍞</div>
                        <div className="my-card-info">
                          <div className="my-review-top">
                            <span className="my-card-title">{review.PLACE_NAME}</span>
                            <span className="my-review-stars">
                              {'★'.repeat(review.RATING)}{'☆'.repeat(5 - review.RATING)}
                            </span>
                          </div>
                          <p className="my-review-content">{review.CONTENT}</p>
                          <span className="my-card-meta">{new Date(review.CREATED_TIME).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="my-card-actions">
                          <button className="my-card-delete-btn" onClick={() => handleDeleteReview(review.REVIEW_NUM)}>삭제</button>
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

            {/* --- 좋아요한 코스 탭 --- */}
            {activeMenu === 'liked' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : likedCourses.length > 0 ? (
                  <div className="my-card-list">
                    {likedCourses.map((course) => (
                      <div
                        key={course.COURSE_NUM}
                        className="my-card"
                        onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                      >
                        <div className="my-card-thumb">🍞</div>
                        <div className="my-card-info">
                          <span className="my-card-title">{course.TITLE}</span>
                          <span className="my-card-meta">
                            by {course.author} · 📍 {course.placeCount}곳 · ❤️ {course.likeCount}
                          </span>
                        </div>
                        <div className="my-card-actions">
                          <button
                            className="my-card-unlike-btn"
                            onClick={(e) => { e.stopPropagation(); handleUnlike(course.COURSE_NUM); }}
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

            {/* --- 스크랩한 코스 탭 --- */}
            {activeMenu === 'scraped' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : scrapedCourses.length > 0 ? (
                  <div className="my-card-list">
                    {scrapedCourses.map((course) => (
                      <div
                        key={course.COURSE_NUM}
                        className="my-card"
                        onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                      >
                        <div className="my-card-thumb">🍞</div>
                        <div className="my-card-info">
                          <span className="my-card-title">{course.TITLE}</span>
                          <span className="my-card-meta">
                            by {course.author} · 📍 {course.placeCount}곳 · 🔖 {course.scrapCount}
                          </span>
                        </div>
                        <div className="my-card-actions">
                          <button
                            className="my-card-unscrap-btn"
                            onClick={(e) => { e.stopPropagation(); handleUnscrap(course.COURSE_NUM); }}
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

            {/* --- 내가 작성한 질문 탭 --- */}
            {activeMenu === 'qna' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : myPosts.length > 0 ? (
                  <div className="my-card-list">
                    {myPosts.map((post) => (
                      <div
                        key={post.BOARD_NUM}
                        className="my-card"
                        onClick={() => navigate(`/community/${post.BOARD_NUM}`)}
                      >
                        <div className="my-card-thumb my-card-thumb-question">💬</div>
                        <div className="my-card-info">
                          <span className="my-card-title">{post.TITLE}</span>
                          <span className="my-card-meta">
                            💬 댓글 {post.commentCount}개 · {new Date(post.CREATED_TIME).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="my-card-actions">
                          <span className={`my-question-status ${post.commentCount > 0 ? 'answered' : 'waiting'}`}>
                            {post.commentCount > 0 ? '답변완료' : '답변대기'}
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
      </div>
    </div>
  );
}
