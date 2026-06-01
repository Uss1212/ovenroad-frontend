/* ===================================================
   Header 컴포넌트 (헤더)
   - 모든 페이지 맨 위에 고정되는 공통 컴포넌트
   - 왼쪽: 로고 (클릭하면 메인페이지로 이동)
   - 가운데: 검색 아이콘 + 네비게이션 메뉴들
   - 오른쪽: 로그인 버튼 + 다크모드 토글
   - useNavigate: 버튼 클릭 시 다른 페이지로 이동하는 도구
   - useLocation: 지금 어떤 페이지에 있는지 알려주는 도구
   =================================================== */

import { useState, useEffect, useRef } from 'react'; /* useState: 상태 관리, useEffect: 화면 로딩 시 실행, useRef: DOM 참조 */
import { useNavigate, useLocation } from 'react-router-dom'; /* 페이지 이동 도구 */
import './Header.css'; /* Header 전용 스타일(CSS)을 불러옴 */

export default function Header() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();
  const location = useLocation();

  /* --- 드롭다운 메뉴 바깥 클릭 감지용 참조 --- */
  const dropdownRef = useRef(null);

  /* --- 상태(state) 관리 --- */
  /* user: 로그인한 사용자 정보 (없으면 null = 로그인 안 한 상태) */
  const [user, setUser] = useState(null);
  /* 프로필 드롭다운 메뉴가 열려있는지 여부 */
  const [showDropdown, setShowDropdown] = useState(false);

  /* --- 페이지가 바뀔 때마다 로그인 상태 확인 --- */
  /* localStorage에 저장된 사용자 정보를 가져옴 */
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  }, [location]); /* location이 바뀔 때마다 (= 페이지 이동할 때마다) 실행 */

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener('userUpdated', syncUser);
    return () => window.removeEventListener('userUpdated', syncUser);
  }, []);

  /* --- 드롭다운 바깥을 클릭하면 메뉴 닫기 --- */
  useEffect(() => {
    function handleClickOutside(e) {
      /* 드롭다운 영역 바깥을 클릭했으면 닫기 */
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    /* 컴포넌트가 사라지면 이벤트 정리 */
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* --- 로그아웃 함수 --- */
  const handleLogout = () => {
    localStorage.removeItem('user'); /* 저장된 사용자 정보 삭제 */
    setUser(null);                   /* 상태도 초기화 */
    navigate('/');                    /* 메인 페이지로 이동 */
  };


  return (
    // header 태그: 페이지 맨 위에 고정되는 영역
    <header className="header">

      {/* ---- 헤더 안쪽 내용을 감싸는 컨테이너 (최대 너비 제한) ---- */}
      <div className="header-inner">

        {/* ===== 왼쪽 영역: 로고 ===== */}
        {/* 로고를 클릭하면 메인 페이지("/")로 이동 */}
        <div
          className="header-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="오븐로드" style={{ height: '44px' }} />
        </div>

        {/* ===== 가운데 영역: 네비게이션 ===== */}
        <nav className="header-nav">
          <button className={`header-nav-item${location.pathname === '/places' ? ' active' : ''}`} onClick={() => navigate('/places')}>빵집 목록</button>
          <button className={`header-nav-item${location.pathname === '/courses' ? ' active' : ''}`} onClick={() => navigate('/courses')}>코스 목록</button>
          <button className={`header-nav-item${location.pathname === '/create' ? ' active' : ''}`} onClick={() => navigate('/create')}>코스 만들기</button>
        </nav>

        {/* ===== 오른쪽 영역 ===== */}
        <div className="header-actions">

          {/* 로그인 상태에 따라 다르게 보여줌 */}
          {user ? (
            /* ── 로그인 한 상태: 프로필 사진 + 드롭다운 메뉴 ── */
            <div className="header-user-area" ref={dropdownRef}>
              <div
                className="header-profile"
                onClick={() => setShowDropdown(!showDropdown)}
                title="메뉴 열기"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="프로필" className="header-profile-img" />
                ) : (
                  <div className="header-profile-default">
                    {user.nickname?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {showDropdown && (
                <div className="header-dropdown">
                  <button
                    className="header-dropdown-item"
                    onClick={() => { navigate('/mypage'); setShowDropdown(false); }}
                  >
                    👤 마이페이지
                  </button>
                  <button
                    className="header-dropdown-item"
                    onClick={() => { navigate('/notice'); setShowDropdown(false); }}
                  >
                    📢 공지·FAQ·문의
                  </button>
                  {(user.grade === 'admin' || user.grade === 1 || user.grade === '1') && (
                    <button
                      className="header-dropdown-item"
                      onClick={() => { navigate('/admin'); setShowDropdown(false); }}
                    >
                      ⚙️ 관리자
                    </button>
                  )}
                  <button
                    className="header-dropdown-item logout"
                    onClick={() => { handleLogout(); setShowDropdown(false); }}
                  >
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── 로그인 안 한 상태: 로그인 텍스트 ── */
            <button
              className="header-login-btn"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
