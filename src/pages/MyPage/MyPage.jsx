import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BASE_URL,
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
  checkEmail,
  sendEmailVerification,
  verifyEmailCode,
} from '../../api/apiAxios';
import './MyPage.css';

export default function MyPage() {

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('courses');
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [deletePw, setDeletePw] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [nicknameMsg, setNicknameMsg] = useState('');

  const [myCourses, setMyCourses] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [likedCourses, setLikedCourses] = useState([]);
  const [scrapedCourses, setScrapedCourses] = useState([]);
  const [myDrafts, setMyDrafts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const menuItems = [
    { id: 'profile', label: '회원 정보 관리', icon: '👤' },
    { id: 'courses', label: '내가 만든 코스', icon: '🗺️' },
    { id: 'drafts', label: '임시저장', icon: '📝' },
    { id: 'reviews', label: '내가 남긴 리뷰', icon: '⭐' },
    { id: 'liked', label: '좋아요한 코스', icon: '❤️' },
    { id: 'scraped', label: '저장된 코스', icon: '🔖' },
    { id: 'qna', label: '내가 작성한 질문', icon: '💬' },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(savedUser);

    getUserInfo(parsed.userNum)
      .then((data) => {
        setUser(data);
        setNickname(data.NICKNAME || '');
      })
      .catch(() => {
        setUser(parsed);
        setNickname(parsed.nickname || '');
      });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
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

  const handleUnlike = async (courseNum) => {
    const userNum = user.USER_NUM || user.userNum;
    try {
      await toggleCourseLike(courseNum, userNum);
      setLikedCourses(prev => prev.filter(c => c.COURSE_NUM !== courseNum));
    } catch (err) {
      console.error('좋아요 취소 실패:', err);
    }
  };

  const handleUnscrap = async (courseNum) => {
    const userNum = user.USER_NUM || user.userNum;
    try {
      await toggleCourseScrap(courseNum, userNum);
      setScrapedCourses(prev => prev.filter(c => c.COURSE_NUM !== courseNum));
    } catch (err) {
      console.error('스크랩 취소 실패:', err);
    }
  };

  const handleDeleteDraft = async (draftNum) => {
    if (!window.confirm('임시저장을 삭제하시겠습니까?')) return;
    try {
      await deleteDraft(draftNum);
      setMyDrafts(prev => prev.filter(d => d.DRAFT_NUM !== draftNum));
    } catch (err) {
      console.error('임시저장 삭제 실패:', err);
    }
  };

  const handleEditDraft = (draft) => {
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

  const handleDeleteReview = async (reviewNum) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
    const userNum = user.USER_NUM || user.userNum;
    try {
      await deleteReview(reviewNum, userNum);
      setMyReviews(prev => prev.filter(r => r.REVIEW_NUM !== reviewNum));
    } catch (err) {
      console.error('리뷰 삭제 실패:', err);
    }
  };

  const handleSendEmailCode = async () => {
    setMessage('');
    setError('');
    if (!newEmail) { setError('새 이메일을 입력해주세요.'); return; }
    try {
      await checkEmail(newEmail);
    } catch (err) {
      if (err.status === 409) {
        alert('이미 다른 계정에서 사용 중인 이메일입니다.');
        return;
      }
    }
    try {
      await sendEmailVerification(newEmail);
      setEmailCodeSent(true);
      setMessage('인증코드가 이메일로 전송되었습니다.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyEmailCode = async () => {
    setMessage('');
    setError('');
    if (!emailCode) { setError('인증코드를 입력해주세요.'); return; }
    try {
      await verifyEmailCode(newEmail, emailCode);
      setEmailVerified(true);
      setMessage('이메일이 인증되었습니다.');
    } catch {
      setError('인증코드가 올바르지 않습니다.');
    }
  };

  const handleSaveEmail = async () => {
    setMessage('');
    setError('');
    if (!emailVerified) { setError('이메일 인증을 완료해주세요.'); return; }
    try {
      const userNum = user.USER_NUM || user.userNum;
      await updateUserInfo(userNum, { email: newEmail });
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.email = newEmail;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setUser(prev => ({ ...prev, EMAIL: newEmail }));
      setNewEmail('');
      setEmailCode('');
      setEmailCodeSent(false);
      setEmailVerified(false);
      setMessage('이메일이 수정되었습니다.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setNicknameMsg('');
    if (!nickname || nickname.length < 2) {
      setNicknameMsg('error:닉네임은 2자 이상이어야 합니다.');
      return;
    }
    try {
      const userNum = user.USER_NUM || user.userNum;
      await updateUserInfo(userNum, { nickname });
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.nickname = nickname;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setUser(prev => ({ ...prev, NICKNAME: nickname, nickname }));
      setNicknameMsg('success:닉네임이 수정되었습니다.');
    } catch (err) {
      setNicknameMsg('error:' + err.message);
    }
  };

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

  const isSocialUser = user?.SOCIAL_TYPE === 'naver' || user?.SOCIAL_TYPE === 'kakao' || user?.socialType === 'naver' || user?.socialType === 'kakao';

  const handleDeleteAccount = async () => {
    setError('');
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  if (!user) {
    return <div className="mypage"><p>로딩 중...</p></div>;
  }

  const userName = user.NAME || user.name || '사용자';
  const userEmail = user.EMAIL || user.email || '';
  const userNickname = user.NICKNAME || user.nickname || userName;
  const currentLabel = menuItems.find((m) => m.id === activeMenu)?.label || '';

  return (
    <div className="mypage">
      <div className="mypage-container">
        <div className="mypage-layout">

          <div className="mypage-sidebar">
            <div className="mypage-profile">
              <div className="mypage-avatar">
                <span>{userNickname[0]}</span>
              </div>
              <h2 className="mypage-name">{userNickname}</h2>
              <p className="mypage-email">{userEmail}</p>
              <button
                className="mypage-profile-edit-btn"
                onClick={() => setActiveMenu('profile')}
              >
                프로필 수정
              </button>
            </div>

            <div className="mypage-menu">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`mypage-menu-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveMenu(item.id); setMessage(''); setError(''); setNicknameMsg(''); }}
                >
                  <span className="mypage-menu-label">
                    <span className="mypage-menu-icon">{item.icon}</span>
                    {item.label}
                  </span>
                  {activeMenu === item.id && <span className="mypage-menu-arrow">→</span>}
                </button>
              ))}
              <div className="mypage-menu-divider" />
              <button className="mypage-logout-btn" onClick={handleLogout}>
                🚪 로그아웃
              </button>
            </div>
          </div>

          <div className="mypage-content">
            <h2 className="mypage-content-title">{currentLabel}</h2>

            {activeMenu === 'profile' && (
              <div className="mypage-info-section">
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
                {nicknameMsg && (
                  <p className={`mypage-message ${nicknameMsg.startsWith('success') ? 'success' : 'error'}`}>
                    {nicknameMsg.replace(/^(success|error):/, '')}
                  </p>
                )}

                <hr className="mypage-divider" />

                <h3 className="mypage-section-title">이메일 수정</h3>
                <div className="mypage-field">
                  <label className="mypage-label">현재 이메일</label>
                  <input
                    type="text"
                    className="mypage-input"
                    value={userEmail}
                    disabled
                  />
                </div>
                <div className="mypage-field">
                  <label className="mypage-label">새 이메일</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      className="mypage-input"
                      placeholder="새 이메일 입력"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailCodeSent(false); setEmailVerified(false); }}
                      style={{ flex: 1 }}
                    />
                    <button className="mypage-save-btn" style={{ whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }} onClick={handleSendEmailCode}>
                      인증코드 발송
                    </button>
                  </div>
                </div>
                {emailCodeSent && (
                  <div className="mypage-field">
                    <label className="mypage-label">인증코드</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="mypage-input"
                        placeholder="인증코드 6자리 입력"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        style={{ flex: 1 }}
                        disabled={emailVerified}
                      />
                      <button className="mypage-save-btn" style={{ whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }} onClick={handleVerifyEmailCode} disabled={emailVerified}>
                        {emailVerified ? '인증완료' : '인증 확인'}
                      </button>
                    </div>
                  </div>
                )}
                {emailVerified && (
                  <button className="mypage-save-btn" onClick={handleSaveEmail}>
                    이메일 저장
                  </button>
                )}

                <hr className="mypage-divider" />

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

                {message && <p className="mypage-message success">{message}</p>}
                {error && <p className="mypage-message error">{error}</p>}

                <hr className="mypage-divider" />

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

            {activeMenu === 'courses' && (
              <div className="my-card-grid">
                <div className="my-card-create" onClick={() => navigate('/create')}>
                  <span className="my-card-create-icon">🗺️</span>
                  <span className="my-card-create-text">새 코스 만들기</span>
                </div>
                {tabLoading && <p style={{ color: '#999', padding: '20px' }}>불러오는 중...</p>}
                {myCourses.map((course) => (
                  <div
                    key={course.COURSE_NUM}
                    className="my-course-card"
                    onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                  >
                    <div className="my-course-card-img">
                      {(() => {
                        const src = course.COVER_IMAGE || course.thumbnailImage;
                        if (src) {
                          const imgUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
                          return <img src={imgUrl} alt={course.TITLE} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                        }
                        return <div style={{ width: '100%', height: '100%', background: '#e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍞</div>;
                      })()}
                      <span className="my-course-card-badge">공개</span>
                    </div>
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

            {activeMenu === 'drafts' && (
              <div>
                {tabLoading ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>불러오는 중...</p>
                ) : myDrafts.length > 0 ? (
                  <div className="my-card-list">
                    {myDrafts.map((draft) => {
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
                    <p className="mypage-empty-title">저장된 코스가 없어요</p>
                    <p className="mypage-empty-desc">나중에 보고 싶은 코스를 스크랩해보세요!</p>
                    <button className="mypage-empty-btn" onClick={() => navigate('/courses')}>
                      코스 둘러보기
                    </button>
                  </div>
                )}
              </div>
            )}

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
