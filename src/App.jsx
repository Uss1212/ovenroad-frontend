/* ===================================================
   App 컴포넌트 (앱의 메인)
   - 모든 페이지의 시작점
   - Header(공통) + 바디(페이지별) + Footer(공통) 조합
   - BrowserRouter: URL에 따라 다른 페이지를 보여줌
   - Routes 안에 각 페이지의 경로(path)와 컴포넌트를 등록
   =================================================== */

/* --- react-router-dom에서 필요한 도구들 가져오기 --- */
// BrowserRouter: 브라우저의 URL을 관리하는 최상위 컨테이너
// Routes: 여러 Route를 감싸는 그룹
// Route: "이 URL이면 → 이 컴포넌트를 보여줘" 라는 규칙
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/Header/Header';  // 공통 헤더
import Footer from './components/Footer/Footer';  // 공통 푸터
import HeroBanner from './components/HeroBanner/HeroBanner'; // 메인 히어로 배너
import BreadBTI from './components/BreadBTI/BreadBTI'; // 빵BTI 미니게임
import TodayCourse from './components/TodayCourse/TodayCourse'; // 오늘의 추천 코스
import RegionCourse from './components/RegionCourse/RegionCourse'; // 지역별 추천 코스
import Notice from './components/Notice/Notice'; // 공지사항
import Login from './pages/Login/Login'; // 로그인
import NaverCallback from './pages/Login/NaverCallback'; // 네이버 로그인 콜백
import KakaoCallback from './pages/Login/KakaoCallback'; // 카카오 로그인 콜백
import Signup from './pages/Signup/Signup'; // 회원가입
import FindAccount from './pages/FindAccount/FindAccount'; // 아이디/비밀번호 찾기
import CourseDetail from './pages/CourseDetail/CourseDetail'; // 코스 상세
import MyPage from './pages/MyPage/MyPage'; // 마이페이지
import CreateCourse from './pages/CreateCourse/CreateCourse'; // 코스 만들기
import PlaceDetail from './pages/PlaceDetail/PlaceDetail'; // 빵집 상세
import PlaceList from './pages/PlaceList/PlaceList'; // 빵집 목록
/* BreadMap: 빵지도 별도 페이지는 제거 (메인 HeroBanner 지도로 통합) */
import CourseList from './pages/CourseList/CourseList'; // 추천코스 목록
import NoticeList from './pages/NoticeList/NoticeList'; // 고객지원 (공지사항/FAQ/문의)
import NoticeDetail from './pages/NoticeDetail/NoticeDetail'; // 공지사항 상세
import './css/App.css';

/* --- 메인 페이지 컴포넌트 --- */
/* 메인 페이지에서만 보여줄 컴포넌트들을 모아둔 것 */
function MainPage() {
  return (
    <>
      {/* 히어로 배너: 지도 배경 + 빵집 카드 */}
      <HeroBanner />
      {/* 빵BTI 미니게임: 빵 취향 테스트 */}
      <BreadBTI />
      {/* 오늘의 추천 코스: 센터 포커스 캐러셀 */}
      <TodayCourse />
      {/* 지역별 추천 코스: 가로 스크롤 카드 */}
      <RegionCourse />
      {/* 공지사항: 최신 공지 4개 목록 */}
      <Notice />
    </>
  );
}

function App() {
  return (
    /* BrowserRouter: URL 변화를 감지해서 페이지를 바꿔줌 */
    <BrowserRouter>
      <div className="app">
        {/* 공통 헤더 - 모든 페이지 상단에 표시 */}
        <Header />

        {/* 바디 영역 - URL에 따라 다른 컴포넌트가 보임 */}
        <main className="main-content">
          <Routes>
            {/* "/" → 메인 페이지 */}
            <Route path="/" element={<MainPage />} />
            {/* "/login" → 로그인 페이지 */}
            <Route path="/login" element={<Login />} />
            {/* "/login/naver-callback" → 네이버 로그인 후 돌아오는 페이지 */}
            <Route path="/login/naver-callback" element={<NaverCallback />} />
            {/* "/login/kakao-callback" → 카카오 로그인 후 돌아오는 페이지 */}
            <Route path="/login/kakao-callback" element={<KakaoCallback />} />
            {/* "/signup" → 회원가입 페이지 */}
            <Route path="/signup" element={<Signup />} />
            {/* "/find-account" → 아이디/비밀번호 찾기 페이지 */}
            <Route path="/find-account" element={<FindAccount />} />
            {/* "/courses/:id" → 코스 상세 페이지 (:id는 코스 번호) */}
            <Route path="/courses/:id" element={<CourseDetail />} />
            {/* "/mypage" → 마이페이지 */}
            <Route path="/mypage" element={<MyPage />} />
            {/* "/create" → 코스 만들기 */}
            <Route path="/create" element={<CreateCourse />} />
            {/* "/place/:id" → 빵집 상세 페이지 (:id는 빵집 번호) */}
            <Route path="/place/:id" element={<PlaceDetail />} />
            {/* "/places" → 빵집 목록 (인기있는 빵집 View more) */}
            <Route path="/places" element={<PlaceList />} />
            {/* /map 라우트 제거 → 메인 HeroBanner 지도로 통합 */}
            {/* "/courses" → 추천코스 목록 */}
            <Route path="/courses" element={<CourseList />} />
            {/* "/notice" → 고객지원 (공지사항/FAQ/문의하기) */}
            <Route path="/notice" element={<NoticeList />} />
            {/* "/notice/:id" → 공지사항 상세 */}
            <Route path="/notice/:id" element={<NoticeDetail />} />
          </Routes>
        </main>

        {/* 공통 푸터 - 모든 페이지 하단에 표시 */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
