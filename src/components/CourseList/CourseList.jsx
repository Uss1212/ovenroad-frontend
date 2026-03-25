/* ===================================================
   CourseList 컴포넌트 (코스 탐색 페이지)
   - 매이슨리 스타일 그리드
   - 필터 버튼 + 정렬 버튼 + 카드 + 더보기
   - DB에서 코스 목록을 가져와서 표시
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseList, BASE_URL } from '../../api/api'; /* 코스 목록 API + 서버 주소 */
import './CourseList.css';

export default function CourseList() {

  /* 페이지 이동 도구 */
  const navigate = useNavigate();

  /* 현재 선택한 정렬 방식 */
  const [activeSort, setActiveSort] = useState('인기순');

  /* DB에서 가져온 코스 목록 */
  const [courses, setCourses] = useState([]);

  /* 로딩 중인지 */
  const [loading, setLoading] = useState(true);

  /* 보여줄 코스 개수 (처음 8개, 더보기 누르면 4개씩 추가) */
  const [visibleCount, setVisibleCount] = useState(8);

  /* 정렬 옵션 목록 */
  const sortOptions = ['인기순', '최신순', '좋아요순'];

  /* 정렬 옵션 → API sort 파라미터 변환 */
  const getSortParam = (sort) => {
    if (sort === '인기순') return 'popular';
    if (sort === '좋아요순') return 'popular';
    return 'latest';
  };

  /* --- 코스 데이터 불러오기 --- */
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data = await getCourseList(getSortParam(activeSort));
        setCourses(data);
      } catch (err) {
        console.error('코스 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [activeSort]);

  return (
    /* 전체 페이지 배경 */
    <div className="explore-page">
      <div className="explore-container">

        {/* ===== 1. 헤더: 제목 + 필터 버튼들 ===== */}
        <div className="explore-header">
          <div>
            <h1 className="explore-title">코스 탐색</h1>
            <p className="explore-subtitle">
              다른 사람들이 만든 개성 있는 빵 코스를 구경해보세요
            </p>
          </div>

          <div className="explore-filters">
            {sortOptions.map((s) => (
              <button
                key={s}
                className={`explore-filter-btn ${activeSort === s ? 'active' : ''}`}
                onClick={() => setActiveSort(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 개수 표시 */}
        {!loading && (
          <p className="explore-result-count">
            총 <strong>{courses.length}</strong>개의 코스
          </p>
        )}

        {/* ===== 2. 로딩 상태 ===== */}
        {loading && (
          <div className="explore-loading">
            <span className="explore-loading-icon">🍞</span>
            <p>코스를 불러오는 중...</p>
          </div>
        )}

        {/* 코스 없음 */}
        {!loading && courses.length === 0 && (
          <div className="explore-empty">
            <span className="explore-empty-icon">📝</span>
            <p className="explore-empty-title">아직 만들어진 코스가 없어요</p>
            <p className="explore-empty-desc">첫 코스를 만들어보세요!</p>
            <button className="explore-empty-btn" onClick={() => navigate('/create')}>
              코스 만들기
            </button>
          </div>
        )}

        <div className="explore-grid">
          {courses.slice(0, visibleCount).map((course, i) => (
            <div
              key={course.COURSE_NUM}
              className="explore-card"
              onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
            >
              {/* 카드 이미지 (높이 통일) */}
              <div className="explore-card-img">
                {(course.COVER_IMAGE || course.thumbnailImage) ? (
                  <img
                    src={(() => {
                      if (course.COVER_IMAGE) {
                        try {
                          const parsed = JSON.parse(course.COVER_IMAGE);
                          const first = Array.isArray(parsed) ? parsed[0] : course.COVER_IMAGE;
                          return `${BASE_URL}${first}`;
                        } catch { return `${BASE_URL}${course.COVER_IMAGE}`; }
                      }
                      return course.thumbnailImage;
                    })()}
                    alt={course.TITLE}
                    className="explore-card-photo"
                  />
                ) : (
                  /* 이미지 없으면 빵 이모지 + 그라데이션 배경 */
                  <div className="explore-card-placeholder">
                    <span>🍞</span>
                  </div>
                )}
              </div>

              {/* 카드 하단: 제목 + 설명 + 좋아요 */}
              <div className="explore-card-body">
                <h3 className="explore-card-title">{course.TITLE}</h3>
                <p className="explore-card-subtitle">{course.SUBTITLE || ''}</p>
                <div className="explore-card-footer">
                  <div className="explore-card-tags">
                    <span className="explore-card-tag">by {course.author}</span>
                  </div>
                  <div className="explore-card-likes">
                    ❤️ {course.likeCount || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== 3. 더보기 버튼 ===== */}
        {!loading && visibleCount < courses.length && (
          <div className="explore-load-more">
            <button
              className="explore-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 8)}
            >
              더보기 ({visibleCount}/{courses.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
