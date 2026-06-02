import { useState, useEffect, useRef } from 'react';
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
  togglePlaceBookmark,
  getMyBookmarkedPlaces,
  deleteReview,
  getMyDrafts,
  deleteDraft,
  checkEmail,
  sendEmailVerification,
  verifyEmailCode,
  uploadProfileImage,
  deleteProfileImage,
} from '../../api/apiAxios';
import './MyPage.css';

export default function MyPage() {

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('profile');
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
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const profileImageRef = useRef(null);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const PREVIEW_COUNT = 4;

  const menuItems = [
    { id: 'profile', label: '회원 정보 관리' },
    { id: 'courses', label: '내가 만든 코스' },
    { id: 'drafts', label: '임시저장' },
    { id: 'reviews', label: '리뷰 기록' },
    { id: 'liked', label: '좋아요 기록' },
    { id: 'scraped', label: '저장된 기록' },
    { id: 'qna', label: '내가 작성한 질문' },
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
          const [courses, places] = await Promise.all([
            getLikedCourses(userNum),
            getMyBookmarkedPlaces(),
          ]);
          setLikedCourses(courses);
          setBookmarkedPlaces(places);
        } else if (activeMenu === 'scraped') {
          const [courses, places] = await Promise.all([
            getScrapedCourses(userNum),
            getMyBookmarkedPlaces(),
          ]);
          setScrapedCourses(courses);
          setBookmarkedPlaces(places);
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

  const handleUnbookmarkPlace = async (placeNum) => {
    try {
      await togglePlaceBookmark(placeNum);
      setBookmarkedPlaces(prev => prev.filter(p => p.PLACE_NUM !== placeNum));
    } catch (err) {
      console.error('북마크 해제 실패:', err);
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

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const userNum = user.USER_NUM || user.userNum;
      const result = await uploadProfileImage(userNum, file);
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.profileImage = result.imageUrl;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setUser(prev => ({ ...prev, PROFILE_IMAGE: result.imageUrl }));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      alert('프로필 이미지 업로드에 실패했습니다: ' + err.message);
    }
    e.target.value = '';
  };

  const handleDeleteProfileImage = async () => {
    if (!window.confirm('프로필 사진을 삭제하시겠습니까?')) return;
    try {
      const userNum = user.USER_NUM || user.userNum;
      await deleteProfileImage(userNum);
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.profileImage = null;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setUser(prev => ({ ...prev, PROFILE_IMAGE: null }));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      alert('프로필 이미지 삭제에 실패했습니다: ' + err.message);
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
              <div className="mypage-avatar-wrap">
                <div className="mypage-avatar" onClick={() => profileImageRef.current?.click()}>
                  {user?.PROFILE_IMAGE ? (
                    <img src={user.PROFILE_IMAGE} alt="프로필" className="mypage-avatar-img" />
                  ) : (
                    <span>{userNickname[0]}</span>
                  )}
                  <div className="mypage-avatar-overlay">
                    <i className="fi fi-rs-camera"></i>
                  </div>
                </div>
                {user?.PROFILE_IMAGE && (
                  <button className="mypage-avatar-delete-btn" onClick={handleDeleteProfileImage}>✕</button>
                )}
                <input
                  ref={profileImageRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleProfileImageUpload}
                />
              </div>
              <h2 className="mypage-name">{userNickname}</h2>
              <p className="mypage-email">{userEmail}</p>
              <div className="mypage-stats">
                <span className="mypage-stat">✏️ {myCourses.length || 0}</span>
                <span className="mypage-stat-divider">|</span>
                <span className="mypage-stat">❤️ {likedCourses.length || 0}</span>
              </div>
              <button className="mypage-logout-text" onClick={handleLogout}>
                로그아웃
              </button>
            </div>

            <div className="mypage-menu">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`mypage-menu-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveMenu(item.id); setMessage(''); setError(''); setNicknameMsg(''); }}
                >
                  <span className="mypage-menu-label">{item.label}</span>
                  {activeMenu === item.id && <span className="mypage-menu-arrow">›</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mypage-content">
            <h2 className="mypage-content-title">{currentLabel}</h2>

            {activeMenu === 'profile' && (
              <div className="mypage-info-section">
                <h3 className="mypage-section-title">기본 정보</h3>
                <div className="mypage-field">
                  <label className="mypage-label">아이디</label>
                  <input
                    type="text"
                    className="mypage-input"
                    value={user.ID || user.id || '소셜 로그인 사용자'}
                    disabled
                  />
                  <p className="mypage-field-hint">아이디는 변경할 수 없습니다.</p>
                </div>

                <div className="mypage-field">
                  <label className="mypage-label">닉네임</label>
                  <div className="mypage-inline-field">
                    <input
                      type="text"
                      className="mypage-input"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                    <button className="mypage-inline-btn" onClick={handleSave}>
                      닉네임 변경
                    </button>
                  </div>
                  {nicknameMsg && (
                    <p className={`mypage-message ${nicknameMsg.startsWith('success') ? 'success' : 'error'}`}>
                      {nicknameMsg.replace(/^(success|error):/, '')}
                    </p>
                  )}
                </div>

                <hr className="mypage-divider" />

                <h3 className="mypage-section-title">이메일</h3>
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
                  <div className="mypage-inline-field">
                    <input
                      type="email"
                      className="mypage-input"
                      placeholder="새 이메일 입력"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailCodeSent(false); setEmailVerified(false); }}
                    />
                    <button className="mypage-inline-btn outlined" onClick={handleSendEmailCode}>
                      인증코드 발송
                    </button>
                  </div>
                </div>
                {emailCodeSent && (
                  <div className="mypage-field">
                    <div className="mypage-inline-field">
                      <input
                        type="text"
                        className="mypage-input"
                        placeholder="인증코드 6자리 입력"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        disabled={emailVerified}
                      />
                      <button className="mypage-inline-btn outlined" onClick={handleSendEmailCode}>
                        재발송
                      </button>
                      <button className="mypage-inline-btn" onClick={handleVerifyEmailCode} disabled={emailVerified}>
                        {emailVerified ? '인증완료' : '확인'}
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
                  <label className="mypage-label">새 비밀번호</label>
                  <input
                    type="password"
                    className="mypage-input"
                    placeholder="새 비밀번호 입력 (8자 이상)"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                  {newPw && (
                    <div className="mypage-pw-strength">
                      <span className={`mypage-pw-bar ${newPw.length >= 8 ? 'active' : ''}`} />
                      <span className={`mypage-pw-bar ${newPw.length >= 12 ? 'active' : ''}`} />
                      <span className={`mypage-pw-bar ${newPw.length >= 16 ? 'active' : ''}`} />
                    </div>
                  )}
                  <p className="mypage-field-hint">8~16자의 영문 대소문자, 숫자, 특수문자만 가능합니다.</p>
                </div>
                <div className="mypage-field">
                  <label className="mypage-label">새 비밀번호 확인</label>
                  <div className="mypage-inline-field">
                    <input
                      type="password"
                      className="mypage-input"
                      placeholder="새 비밀번호 확인"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                    <button className="mypage-inline-btn" onClick={handleChangePassword}>
                      확인
                    </button>
                  </div>
                </div>

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
                  <span className="my-card-create-icon">+</span>
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
                          return <img src={imgUrl} alt={course.TITLE} />;
                        }
                        return <div className="my-course-card-placeholder">🍞</div>;
                      })()}
                      <button className="my-course-card-menu" onClick={(e) => e.stopPropagation()}>···</button>
                    </div>
                    <div className="my-course-card-info">
                      <span className="my-course-card-date">{new Date(course.CREATED_TIME).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                      <h3 className="my-course-card-title">{course.TITLE}</h3>
                      <p className="my-course-card-meta">❤️ {course.likeCount || 0}</p>
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
                    {myDrafts.map((draft) => (
                      <div key={draft.DRAFT_NUM} className="my-card" onClick={() => handleEditDraft(draft)}>
                        <div className="my-card-thumb my-card-thumb-draft">✏️</div>
                        <div className="my-card-info">
                          <span className="my-card-date">{new Date(draft.UPDATED_TIME).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                          <span className="my-card-title">{draft.TITLE || '제목 없음'}</span>
                        </div>
                        <div className="my-card-actions">
                          <button
                            className="my-card-more-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDraft(draft.DRAFT_NUM); }}
                          >⋮</button>
                        </div>
                      </div>
                    ))}
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
                      <div key={`${review.REVIEW_TYPE || 'place'}-${review.REVIEW_NUM}`} className="my-card" onClick={() => navigate(review.REVIEW_TYPE === 'course' ? `/courses/${review.PLACE_NUM}` : `/places/${review.PLACE_NUM}`)} style={{ cursor: 'pointer' }}>
                        <div className="my-card-thumb">
                          {review.IMAGE_URL ? (
                            <img src={review.IMAGE_URL.startsWith('http') ? review.IMAGE_URL : `${BASE_URL}${review.IMAGE_URL}`} alt="" />
                          ) : '🍞'}
                        </div>
                        <div className="my-card-info">
                          <span className="my-card-title">{review.CONTENT}</span>
                          <span className="my-card-sub">{review.PLACE_NAME}</span>
                        </div>
                        <div className="my-card-actions">
                          <button
                            className="my-card-more-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.REVIEW_NUM); }}
                          >⋮</button>
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
                ) : (likedCourses.length > 0 || bookmarkedPlaces.length > 0) ? (
                  <>
                    {likedCourses.length > 0 && (
                      <div className="my-section">
                        <h3 className="my-section-title">좋아요한 코스</h3>
                        <div className="my-card-list">
                          {(expandedSections.likedCourses ? likedCourses : likedCourses.slice(0, PREVIEW_COUNT)).map((course) => (
                            <div
                              key={course.COURSE_NUM}
                              className="my-card"
                              onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                            >
                              <div className="my-card-thumb">
                                {course.COVER_IMAGE ? (
                                  <img src={course.COVER_IMAGE.startsWith('http') ? course.COVER_IMAGE : `${BASE_URL}${course.COVER_IMAGE}`} alt={course.TITLE} />
                                ) : '🍞'}
                              </div>
                              <div className="my-card-info">
                                <span className="my-card-date">{new Date(course.CREATED_TIME).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                                <span className="my-card-title">{course.TITLE}</span>
                              </div>
                              <div className="my-card-actions">
                                <button
                                  className="my-card-cancel-btn liked"
                                  onClick={(e) => { e.stopPropagation(); handleUnlike(course.COURSE_NUM); }}
                                >
                                  ❤️ 취소
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {likedCourses.length > PREVIEW_COUNT && (
                          <button className="my-expand-btn" onClick={() => toggleSection('likedCourses')}>
                            <span className={`my-expand-arrow ${expandedSections.likedCourses ? 'up' : ''}`}>⌄</span>
                          </button>
                        )}
                      </div>
                    )}
                    {bookmarkedPlaces.length > 0 && (
                      <div className="my-section">
                        <h3 className="my-section-title">좋아요한 가게</h3>
                        <div className="my-place-grid">
                          {(expandedSections.likedPlaces ? bookmarkedPlaces : bookmarkedPlaces.slice(0, PREVIEW_COUNT)).map((place) => (
                            <div
                              key={place.PLACE_NUM}
                              className="my-place-card"
                              onClick={() => navigate(`/place/${place.PLACE_NUM}`)}
                            >
                              <div className="my-place-card-img">
                                <span className="my-place-card-spacer" />
                                {place.thumbnailImage ? (
                                  <img src={place.thumbnailImage.startsWith('http') ? place.thumbnailImage : `${BASE_URL}${place.thumbnailImage}`} alt={place.PLACE_NAME} />
                                ) : <div className="my-place-card-placeholder">🍞</div>}
                                <button
                                  className="my-place-card-heart"
                                  onClick={(e) => { e.stopPropagation(); handleUnbookmarkPlace(place.PLACE_NUM); }}
                                >❤️</button>
                              </div>
                              <div className="my-place-card-info">
                                <span className="my-place-card-name">{place.PLACE_NAME}</span>
                                <span className="my-place-card-address">{place.ADDRESS}</span>
                                {place.AVG_RATING && <span className="my-place-card-rating">⭐ {place.AVG_RATING}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {bookmarkedPlaces.length > PREVIEW_COUNT && (
                          <button className="my-expand-btn" onClick={() => toggleSection('likedPlaces')}>
                            <span className={`my-expand-arrow ${expandedSections.likedPlaces ? 'up' : ''}`}>⌄</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
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
                ) : (scrapedCourses.length > 0 || bookmarkedPlaces.length > 0) ? (
                  <>
                    {scrapedCourses.length > 0 && (
                      <div className="my-section">
                        <h3 className="my-section-title">저장된 코스</h3>
                        <div className="my-card-list">
                          {(expandedSections.scrapedCourses ? scrapedCourses : scrapedCourses.slice(0, PREVIEW_COUNT)).map((course) => (
                            <div
                              key={course.COURSE_NUM}
                              className="my-card"
                              onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                            >
                              <div className="my-card-thumb">
                                {course.COVER_IMAGE ? (
                                  <img src={course.COVER_IMAGE.startsWith('http') ? course.COVER_IMAGE : `${BASE_URL}${course.COVER_IMAGE}`} alt={course.TITLE} />
                                ) : '🍞'}
                              </div>
                              <div className="my-card-info">
                                <span className="my-card-date">{new Date(course.CREATED_TIME).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                                <span className="my-card-title">{course.TITLE}</span>
                              </div>
                              <div className="my-card-actions">
                                <button
                                  className="my-card-cancel-btn scraped"
                                  onClick={(e) => { e.stopPropagation(); handleUnscrap(course.COURSE_NUM); }}
                                >
                                  🔖 취소
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {scrapedCourses.length > PREVIEW_COUNT && (
                          <button className="my-expand-btn" onClick={() => toggleSection('scrapedCourses')}>
                            <span className={`my-expand-arrow ${expandedSections.scrapedCourses ? 'up' : ''}`}>⌄</span>
                          </button>
                        )}
                      </div>
                    )}
                    {bookmarkedPlaces.length > 0 && (
                      <div className="my-section">
                        <h3 className="my-section-title">저장된 가게</h3>
                        <div className="my-place-grid">
                          {(expandedSections.scrapedPlaces ? bookmarkedPlaces : bookmarkedPlaces.slice(0, PREVIEW_COUNT)).map((place) => (
                            <div
                              key={place.PLACE_NUM}
                              className="my-place-card"
                              onClick={() => navigate(`/place/${place.PLACE_NUM}`)}
                            >
                              <div className="my-place-card-img">
                                <span className="my-place-card-spacer" />
                                {place.thumbnailImage ? (
                                  <img src={place.thumbnailImage.startsWith('http') ? place.thumbnailImage : `${BASE_URL}${place.thumbnailImage}`} alt={place.PLACE_NAME} />
                                ) : <div className="my-place-card-placeholder">🍞</div>}
                                <button
                                  className="my-place-card-bookmark"
                                  onClick={(e) => { e.stopPropagation(); handleUnbookmarkPlace(place.PLACE_NUM); }}
                                >🔖</button>
                              </div>
                              <div className="my-place-card-info">
                                <span className="my-place-card-name">{place.PLACE_NAME}</span>
                                <span className="my-place-card-address">{place.ADDRESS}</span>
                                {place.AVG_RATING && <span className="my-place-card-rating">⭐ {place.AVG_RATING}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {bookmarkedPlaces.length > PREVIEW_COUNT && (
                          <button className="my-expand-btn" onClick={() => toggleSection('scrapedPlaces')}>
                            <span className={`my-expand-arrow ${expandedSections.scrapedPlaces ? 'up' : ''}`}>⌄</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
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
                        onClick={() => navigate(`/notice?tab=question&questionNum=${post.QUESTION_NUM || post.BOARD_NUM}`)}
                      >
                        <div className="my-card-thumb my-card-thumb-question">💬</div>
                        <div className="my-card-info">
                          <span className="my-card-date">{new Date(post.CREATED_TIME).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                          <span className="my-card-title">{post.TITLE}</span>
                          <span className="my-card-sub">{post.commentCount > 0 ? '답변완료' : '답변대기'}</span>
                        </div>
                        <div className="my-card-actions">
                          <button className="my-card-more-btn" onClick={(e) => e.stopPropagation()}>⋮</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mypage-empty">
                    <span className="mypage-empty-icon">💬</span>
                    <p className="mypage-empty-title">아직 작성한 질문이 없어요</p>
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
