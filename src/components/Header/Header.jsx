/* ===================================================
   Header 컴포넌트 (헤더)
   - 모든 페이지 맨 위에 고정되는 공통 컴포넌트
   - 왼쪽: 로고 (클릭하면 메인페이지로 이동)
   - 가운데: 검색 아이콘 + 네비게이션 메뉴들
   - 오른쪽: 로그인 버튼 + 다크모드 토글
   - useNavigate: 버튼 클릭 시 다른 페이지로 이동하는 도구
   - useLocation: 지금 어떤 페이지에 있는지 알려주는 도구
   =================================================== */

import { useState, useEffect } from 'react'; /* useState: 상태 관리, useEffect: 화면 로딩 시 실행 */
import { useNavigate, useLocation } from 'react-router-dom'; /* 페이지 이동 도구 */
import './Header.css'; /* Header 전용 스타일(CSS)을 불러옴 */

export default function Header() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();
  const location = useLocation();

  /* --- 상태(state) 관리 --- */
  const [isDarkMode, setIsDarkMode] = useState(false);
  /* user: 로그인한 사용자 정보 (없으면 null = 로그인 안 한 상태) */
  const [user, setUser] = useState(null);

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

  /* --- 로그아웃 함수 --- */
  const handleLogout = () => {
    localStorage.removeItem('user'); /* 저장된 사용자 정보 삭제 */
    setUser(null);                   /* 상태도 초기화 */
    navigate('/');                    /* 메인 페이지로 이동 */
  };

  /* --- 네비게이션 메뉴 목록 --- */
  // name: 화면에 보여줄 이름
  // path: 클릭하면 이동할 URL 경로
  const navItems = [
    { name: '빵지도',     path: '/map' },       // 빵집 위치를 지도에서 볼 수 있는 페이지
    { name: '추천코스',   path: '/courses' },    // 추천 빵집 코스를 모아보는 페이지
    { name: '코스만들기', path: '/create' },     // 나만의 빵집 코스를 만드는 페이지
    { name: '커뮤니티',   path: '/community' },  // 사용자들끼리 소통하는 게시판
    { name: '이벤트',     path: '/events' },     // 진행 중인 이벤트 페이지
  ];

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
          LOGO
        </div>

        {/* ===== 가운데 영역: 검색 + 네비게이션 메뉴 ===== */}
        <div className="header-center">

          {/* 검색 아이콘 버튼 */}
          <button className="header-search-btn">
            🔍 {/* 돋보기 아이콘 (나중에 SVG 아이콘으로 교체 가능) */}
          </button>

          {/* 네비게이션 메뉴 목록 */}
          <nav className="header-nav">
            {/* navItems 배열을 하나씩 꺼내서 버튼으로 만듦 */}
            {navItems.map((item) => (
              <button
                key={item.name} // 리스트 안의 각 항목을 구분하는 고유 키
                className={`header-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                // ↑ 지금 URL과 메뉴의 path가 같으면 'active' 클래스 추가 (선택된 표시)
                onClick={() => navigate(item.path)}
                // ↑ 메뉴를 클릭하면 해당 경로로 페이지 이동
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* ===== 오른쪽 영역: 로그인 + 다크모드 토글 ===== */}
        <div className="header-actions">

          {/* 로그인 상태에 따라 다르게 보여줌 */}
          {user ? (
            /* ── 로그인 한 상태: 프로필 사진 + 로그아웃 ── */
            <div className="header-user-area">
              {/* 프로필 사진 (클릭하면 마이페이지로 이동) */}
              <div
                className="header-profile"
                onClick={() => navigate('/mypage')}
                title="마이페이지"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="프로필" className="header-profile-img" />
                ) : (
                  /* 프로필 사진이 없으면 닉네임 첫 글자로 표시 */
                  <div className="header-profile-default">
                    {user.nickname?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* 로그아웃 버튼 */}
              <button className="header-logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            /* ── 로그인 안 한 상태: 로그인 버튼 ── */
            <button
              className="header-login-btn"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          )}

          {/* 다크모드 / 라이트모드 토글 버튼 */}
          <div className="header-theme-toggle">
            {/* 해(라이트모드) 버튼 */}
            <button
              className={`theme-btn ${!isDarkMode ? 'active' : ''}`}
              onClick={() => setIsDarkMode(false)}
              // ↑ 클릭하면 라이트모드로 변경
            >
              ☀️
            </button>
            {/* 달(다크모드) 버튼 */}
            <button
              className={`theme-btn ${isDarkMode ? 'active' : ''}`}
              onClick={() => setIsDarkMode(true)}
              // ↑ 클릭하면 다크모드로 변경
            >
              🌙
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
