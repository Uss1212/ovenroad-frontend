/* ===================================================
   TodayCourse 컴포넌트 (오늘의 추천 코스)
   - 메인 페이지에서 HeroBanner 바로 아래에 위치
   - "오늘의 추천 코스" 제목 + View more 링크
   - 좌우로 넘길 수 있는 캐러셀(슬라이더)
   - ★ 핵심 기능: 가운데 카드는 크게, 양옆 카드는 작게 보임
   - ◀ ▶ 버튼으로 카드를 좌우로 넘김
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TodayCourse.css';

export default function TodayCourse() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 사용하는 함수 */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  // currentIndex: 지금 가운데에 있는 카드가 몇 번째인지 기억
  // 예: 0이면 첫번째 카드가 가운데, 1이면 두번째 카드가 가운데
  const [currentIndex, setCurrentIndex] = useState(0);

  /* --- 추천 코스 더미 데이터 --- */
  const courses = [
    { id: 1, title: 'Duis aute irure dolor', author: '빵순이', image: null },
    { id: 2, title: 'Lorem ipsum dolor sit', author: 'bread_lover', image: null },
    { id: 3, title: 'Ut enim ad minim ve...', author: '오븐마스터', image: null },
    { id: 4, title: '을지로 빵투어', author: '빵지순례자', image: null },
    { id: 5, title: '연남동 카페 코스', author: '카페탐험가', image: null },
    { id: 6, title: '성수동 베이커리 투어', author: '빵덕후', image: null },
    { id: 7, title: '이태원 디저트 코스', author: '달콤이', image: null },
    { id: 8, title: '홍대 빵집 탐방', author: '글루텐러버', image: null },
  ];

  /* --- ◀ 왼쪽으로 넘기기 --- */
  // 현재 인덱스를 1 줄임 (0보다 작아지면 마지막 카드로 이동)
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? courses.length - 1 : prev - 1
    );
  };

  /* --- ▶ 오른쪽으로 넘기기 --- */
  // 현재 인덱스를 1 늘림 (마지막이면 첫번째로 돌아감)
  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === courses.length - 1 ? 0 : prev + 1
    );
  };

  /* --- 각 카드의 위치를 계산하는 함수 --- */
  // 가운데 카드(offset=0)는 크게, 양옆(offset=±1,±2)은 작게 표시
  // offset: 가운데 카드와의 거리 (0=가운데, 1=바로 옆, 2=그 옆)
  const getCardStyle = (index) => {
    // offset 계산: 현재 카드(index)가 가운데(currentIndex)에서 얼마나 떨어져 있는지
    let offset = index - currentIndex;

    // 순환 처리: 마지막 카드 → 첫번째 카드로 넘어갈 때 자연스럽게
    if (offset > courses.length / 2) offset -= courses.length;
    if (offset < -courses.length / 2) offset += courses.length;

    // 보이는 범위: 가운데에서 3칸 이내만 보여줌
    const isVisible = Math.abs(offset) <= 3;

    // 카드 크기: 가운데(offset=0)는 1배, 멀어질수록 작아짐
    // offset=0 → scale=1 (100%)
    // offset=1 → scale=0.82 (82%)
    // offset=2 → scale=0.68 (68%)
    const scale = offset === 0 ? 1 : Math.max(0.68, 1 - Math.abs(offset) * 0.18);

    // 카드 투명도: 가운데는 진하게, 멀어질수록 흐려짐
    const opacity = offset === 0 ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.25);

    // 카드 위치: 가운데를 기준으로 좌우로 배치
    // offset * 280 → 카드 간격 (280px씩 이동)
    const translateX = offset * 280;

    // z-index: 가운데 카드가 맨 위에 보이도록
    const zIndex = 10 - Math.abs(offset);

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity: isVisible ? opacity : 0,
      zIndex,
      // 보이지 않는 카드는 클릭 불가
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  };

  return (
    <section className="today-course">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="today-course-header">
        <div>
          <h2 className="today-course-title">오늘의 추천 코스</h2>
          <p className="today-course-subtitle">
            오늘은 어떤 빵지순례를 떠나볼까?
          </p>
        </div>
        <a href="/courses" className="today-course-more" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
          View more →
        </a>
      </div>

      {/* ===== 캐러셀 영역 ===== */}
      <div className="today-course-carousel">

        {/* ◀ 왼쪽 버튼 */}
        <button className="carousel-btn carousel-btn-left" onClick={handlePrev}>
          ◀
        </button>

        {/* --- 카드들이 겹쳐서 배치되는 영역 --- */}
        <div className="today-course-stage">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className={`course-card ${index === currentIndex ? 'active' : ''}`}
              style={getCardStyle(index)}
              // ↑ 각 카드마다 위치/크기/투명도가 다르게 적용됨
              /* 카드를 클릭하면 해당 코스의 상세 페이지(/courses/1, /courses/2 ...)로 이동 */
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              {/* 카드 배경 이미지 */}
              <div className="course-card-img" />

              {/* 카드 하단: 그라데이션 + 제목 + 작성자 */}
              <div className="course-card-overlay">
                <p className="course-card-title">{course.title}</p>
                <div className="course-card-author">
                  <div className="author-avatar" />
                  <span>{course.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ▶ 오른쪽 버튼 */}
        <button className="carousel-btn carousel-btn-right" onClick={handleNext}>
          ▶
        </button>

      </div>
    </section>
  );
}
