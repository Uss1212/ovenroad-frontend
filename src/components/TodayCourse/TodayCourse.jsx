import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseList, BASE_URL } from '../../api/apiAxios';
import './TodayCourse.css';

export default function TodayCourse() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getCourseList('popular')
      .then(data => setCourses(data.slice(0, 8)))
      .catch(err => console.error('추천 코스 불러오기 실패:', err));
  }, []);

  if (courses.length === 0) return null;

  const handlePrev = () => setCurrentIndex(i => (i === 0 ? courses.length - 1 : i - 1));
  const handleNext = () => setCurrentIndex(i => (i === courses.length - 1 ? 0 : i + 1));

  const getThumbnail = (course) => {
    const img = course.thumbnailImage || course.thumbnail || course.COVER_IMAGE;
    if (img) return img.startsWith('http') ? img : `${BASE_URL}${img}`;
    return null;
  };

  const getAuthorAvatar = (course) => {
    const img = course.authorImage || course.PROFILE_IMAGE;
    if (!img) return null;
    return img.startsWith('http') ? img : `${BASE_URL}${img}`;
  };

  const getTags = (course) => {
    if (!course.TAGS) return [];
    try {
      const parsed = typeof course.TAGS === 'string' ? JSON.parse(course.TAGS) : course.TAGS;
      return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
    } catch { return []; }
  };

  /* offset 기준 카드 위치/스타일 계산 */
  const getCardStyle = (index) => {
    let offset = index - currentIndex;
    if (offset > courses.length / 2) offset -= courses.length;
    if (offset < -courses.length / 2) offset += courses.length;

    const isVisible = Math.abs(offset) <= 2;
    const isCenter = offset === 0;

    const scale = isCenter ? 1 : Math.max(0.74, 1 - Math.abs(offset) * 0.26);
    const opacity = isCenter ? 1 : Math.max(0.5, 1 - Math.abs(offset) * 0.3);
    const translateX = offset * 510;
    const zIndex = 10 - Math.abs(offset);

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity: isVisible ? opacity : 0,
      zIndex,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  };

  return (
    <section className="today-course">

      {/* 헤더 */}
      <div className="today-course-header">
        <div>
          <h2 className="today-course-title">오늘의 추천 코스</h2>
          <p className="today-course-subtitle">오늘 하루 이렇게 가보시는건 어때요?</p>
        </div>
        <button className="today-course-more" onClick={() => navigate('/courses')}>
          View more
          <i className="fi fi-rr-caret-right today-course-more-arrow"></i>
        </button>
      </div>

      {/* 캐러셀 */}
      <div className="today-course-carousel">
        <div className="today-course-stage">
          {courses.map((course, index) => {
            const isCenter = index === currentIndex;
            const thumb = getThumbnail(course);
            const avatar = getAuthorAvatar(course);
            const tags = getTags(course);
            const author = course.author || course.NICKNAME || '작성자';

            return (
              <div
                key={course.COURSE_NUM}
                className={`course-card ${isCenter ? 'active' : ''}`}
                style={getCardStyle(index)}
                onClick={() => {
                  if (isCenter) navigate(`/courses/${course.COURSE_NUM}`);
                  else setCurrentIndex(index);
                }}
              >
                {/* 이미지 영역 */}
                <div
                  className="course-card-img"
                  style={{ backgroundImage: thumb ? `url(${thumb})` : undefined }}
                >
                  {!thumb && <span className="course-card-img-placeholder">🍞</span>}

                  {/* 작성자 프로필 사진 */}
                  <div className="course-author-avatar">
                    {avatar
                      ? <img src={avatar} alt={author} />
                      : <span>{author.charAt(0)}</span>}
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.TITLE}</h3>
                  {course.SUBTITLE && (
                    <p className="course-card-subtitle">{course.SUBTITLE}</p>
                  )}
                  <div className="course-card-meta">
                    <span className="course-card-like">
                      <span className="course-like-icon">❤</span>
                      {course.likeCount || 0}
                    </span>
                    {tags.length > 0 && (
                      <div className="course-card-tags">
                        {tags.map(tag => (
                          <span key={tag} className="course-card-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="today-course-pagination">
        <button className="pagination-arrow" onClick={handlePrev}><i className="fi fi-rr-caret-left"></i></button>
        <span className="pagination-text">
          <strong>{currentIndex + 1}</strong>
          <span className="pagination-sep"> / </span>
          {courses.length}
        </span>
        <button className="pagination-arrow" onClick={handleNext}><i className="fi fi-rr-caret-right"></i></button>
      </div>

    </section>
  );
}
