/* ===================================================
   RegionCourse 컴포넌트 (지역별 추천 코스)
   - 메인 페이지에서 TodayCourse 바로 아래에 위치
   - "용산구 추천 코스" 같은 제목 + View more 링크
   - 가로로 스크롤되는 코스 카드 5장
   - ◀ ▶ 버튼으로 카드를 좌우로 넘김
   - 카드에는 썸네일 이미지 + 코스 제목 + 작성자 + 좋아요/스크랩 수
   =================================================== */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegionCourse.css';

export default function RegionCourse() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 스크롤 영역을 직접 조작하기 위한 ref --- */
  // useRef: HTML 요소를 직접 가리키는 "손가락" 같은 것
  // 스크롤 영역(카드 목록)을 가리켜서 ◀▶ 버튼 누를 때 스크롤시킴
  const scrollRef = useRef(null);

  /* --- 추천 코스 더미 데이터 --- */
  // 나중에 백엔드 API에서 받아올 데이터
  // 지금은 가짜 데이터로 화면을 먼저 만듦
  const courses = [
    {
      id: 1,
      title: '을지로 빵 투어 코스',
      author: '빵지순례자',
      likes: 128,
      scraps: 45,
      places: 5,        // 코스에 포함된 장소 수
      image: null,       // 나중에 실제 이미지 URL
    },
    {
      id: 2,
      title: '연남동 카페 & 베이커리',
      author: '카페탐험가',
      likes: 96,
      scraps: 32,
      places: 4,
      image: null,
    },
    {
      id: 3,
      title: '성수동 디저트 로드',
      author: '달콤이',
      likes: 214,
      scraps: 87,
      places: 6,
      image: null,
    },
    {
      id: 4,
      title: '홍대 빵집 완전정복',
      author: '글루텐러버',
      likes: 73,
      scraps: 28,
      places: 4,
      image: null,
    },
    {
      id: 5,
      title: '이태원 브런치 코스',
      author: '오븐마스터',
      likes: 156,
      scraps: 61,
      places: 5,
      image: null,
    },
  ];

  /* --- ◀ 왼쪽으로 스크롤 --- */
  // 카드 목록을 왼쪽으로 300px만큼 부드럽게 이동
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,           // 왼쪽으로 300px 이동
        behavior: 'smooth',   // 부드럽게 스크롤
      });
    }
  };

  /* --- ▶ 오른쪽으로 스크롤 --- */
  // 카드 목록을 오른쪽으로 300px만큼 부드럽게 이동
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="region-course">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="region-course-header">
        <div>
          {/* 섹션 제목: 어떤 지역의 추천 코스인지 */}
          <h2 className="region-course-title">용산구 추천 코스</h2>
          {/* 부제목: 설명 한 줄 */}
          <p className="region-course-subtitle">
            용산구의 인기 빵지순례 코스를 확인해보세요
          </p>
        </div>
        {/* 더보기 링크: 클릭하면 해당 지역의 코스 전체 목록 페이지로 이동 */}
        {/* 더보기 링크: 클릭하면 추천코스 목록 페이지(/courses)로 이동 */}
        <a
          href="/courses"
          className="region-course-more"
          onClick={(e) => {
            e.preventDefault();
            navigate('/courses');
          }}
        >
          View more →
        </a>
      </div>

      {/* ===== 카드 캐러셀 영역 ===== */}
      <div className="region-course-carousel">

        {/* ◀ 왼쪽 버튼 */}
        <button className="region-btn region-btn-left" onClick={scrollLeft}>
          ◀
        </button>

        {/* --- 카드 목록 (가로 스크롤) --- */}
        {/* ref={scrollRef}: 이 영역을 scrollRef로 가리킴 → 버튼으로 스크롤 제어 가능 */}
        <div className="region-course-list" ref={scrollRef}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="region-card"
              onClick={() => navigate(`/courses/${course.id}`)}
              style={{ cursor: 'pointer' }}
            >

              {/* 카드 상단: 썸네일 이미지 */}
              <div className="region-card-img">
                {/* 나중에 실제 이미지로 교체 */}
                <div className="region-card-placeholder">
                  🍞
                </div>
                {/* 장소 수 뱃지: 카드 오른쪽 상단에 표시 */}
                <span className="region-card-badge">
                  {course.places}곳
                </span>
              </div>

              {/* 카드 하단: 텍스트 정보 */}
              <div className="region-card-body">
                {/* 코스 제목 */}
                <h3 className="region-card-title">{course.title}</h3>

                {/* 작성자 정보 */}
                <div className="region-card-author">
                  {/* 작성자 프로필 사진 (원형) */}
                  <div className="region-author-avatar" />
                  {/* 작성자 이름 */}
                  <span>{course.author}</span>
                </div>

                {/* 좋아요 수 + 스크랩 수 */}
                <div className="region-card-stats">
                  <span>❤️ {course.likes}</span>
                  <span>⭐ {course.scraps}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* ▶ 오른쪽 버튼 */}
        <button className="region-btn region-btn-right" onClick={scrollRight}>
          ▶
        </button>

      </div>
    </section>
  );
}
