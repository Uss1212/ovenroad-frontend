/* ===================================================
   TodayCourse 컴포넌트 (오늘의 추천 코스)
   - 메인 페이지에서 HeroBanner 바로 아래에 위치
   - DB에서 코스 목록을 가져와서 캐러셀로 보여줌
   - ★ 핵심 기능: 가운데 카드는 크게, 양옆 카드는 작게 보임
   - ◀ ▶ 버튼으로 카드를 좌우로 넘김
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseList, BASE_URL } from '../../api/api';
import './TodayCourse.css';

export default function TodayCourse() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  /* currentIndex: 지금 가운데에 있는 카드가 몇 번째인지 */
  const [currentIndex, setCurrentIndex] = useState(0);

  /* DB에서 가져온 코스 목록 */
  const [courses, setCourses] = useState([]);

  /* --- 코스 데이터 불러오기 --- */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        /* 인기순으로 코스 목록을 가져옴 */
        const data = await getCourseList('popular');
        /* 최대 8개만 사용 */
        setCourses(data.slice(0, 8));
      } catch (err) {
        console.error('추천 코스 불러오기 실패:', err);
      }
    };
    fetchCourses();
  }, []);

  /* --- 코스가 없으면 아무것도 안 보여줌 --- */
  if (courses.length === 0) return null;

  /* --- ◀ 왼쪽으로 넘기기 --- */
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? courses.length - 1 : prev - 1
    );
  };

  /* --- ▶ 오른쪽으로 넘기기 --- */
  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === courses.length - 1 ? 0 : prev + 1
    );
  };

  /* --- 각 카드의 위치를 계산하는 함수 --- */
  const getCardStyle = (index) => {
    let offset = index - currentIndex;

    /* 순환 처리: 마지막 → 첫번째로 넘어갈 때 자연스럽게 */
    if (offset > courses.length / 2) offset -= courses.length;
    if (offset < -courses.length / 2) offset += courses.length;

    /* 보이는 범위: 가운데에서 3칸 이내만 보여줌 */
    const isVisible = Math.abs(offset) <= 3;

    /* 카드 크기: 가운데(offset=0)는 1배, 멀어질수록 작아짐 */
    const scale = offset === 0 ? 1 : Math.max(0.68, 1 - Math.abs(offset) * 0.18);

    /* 카드 투명도: 가운데는 진하게, 멀어질수록 흐려짐 */
    const opacity = offset === 0 ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.25);

    /* 카드 위치: 가운데를 기준으로 좌우로 배치 */
    const translateX = offset * 280;

    /* z-index: 가운데 카드가 맨 위에 보이도록 */
    const zIndex = 10 - Math.abs(offset);

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity: isVisible ? opacity : 0,
      zIndex,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  };

  /* --- 코스 썸네일 이미지 URL 가져오기 --- */
  const getThumbnail = (course) => {
    /* DB에서 가져온 썸네일이 있으면 사용 */
    const img = course.thumbnailImage || course.thumbnail;
    if (img) {
      return img.startsWith('http') ? img : `${BASE_URL}${img}`;
    }
    /* 없으면 기본 빵 이미지 */
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop';
  };

  return (
    <section className="today-course">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="today-course-header">
        <div>
          <h2 className="today-course-title">뜨고있는 핫한 코스</h2>
          <p className="today-course-subtitle">
            지금 가장 인기있는 빵지순례 코스
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
              key={course.COURSE_NUM}
              className={`course-card ${index === currentIndex ? 'active' : ''}`}
              style={getCardStyle(index)}
              onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
            >
              {/* 카드 배경 이미지 */}
              <div
                className="course-card-img"
                style={{ backgroundImage: `url(${getThumbnail(course)})` }}
              />

              {/* 카드 하단: 그라데이션 + 제목 + 작성자 */}
              <div className="course-card-overlay">
                <p className="course-card-title">{course.TITLE}</p>
                <div className="course-card-author">
                  <div className="author-avatar" />
                  <span>{course.author || course.NICKNAME || '작성자'}</span>
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
