import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AICourse.css';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export default function AICourse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE_URL}/api/ai-course`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCourses(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || courses.length === 0) return null;

  const active = courses[activeIndex];

  const parseTags = (course) => {
    try {
      return typeof course.TAGS === 'string' ? JSON.parse(course.TAGS) : course.TAGS || {};
    } catch { return {}; }
  };

  const activeTag = parseTags(active);
  const description = active.CONTENT || '';
  const places = activeTag.places || [];

  const parseTheme = (course) => {
    try {
      const t = typeof course.TAGS === 'string' ? JSON.parse(course.TAGS) : course.TAGS || {};
      return t.theme || '';
    } catch { return ''; }
  };

  return (
    <section className="ai-course">
      <div className="ai-course-inner">

        {/* 헤더 */}
        <div className="ai-course-header">
          <div className="ai-course-badge">✦ AI 추천</div>
          <h2 className="ai-course-title">AI가 추천하는 오븐로드 코스</h2>
          <p className="ai-course-subtitle">AI가 빵집 데이터를 분석하여 최적의 코스를 구성했어요</p>
        </div>

        {/* 탭 */}
        <div className="ai-course-tabs">
          {courses.map((c, i) => (
            <button
              key={c.COURSE_NUM}
              className={`ai-course-tab ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              {parseTheme(c) || `코스 ${i + 1}`}
            </button>
          ))}
        </div>

        {/* 카드 */}
        <div className="ai-course-card">
          <div className="ai-course-card-left">
            <h3 className="ai-course-card-title">{active.TITLE}</h3>
            <p className="ai-course-card-desc">{description}</p>
            <div className="ai-course-places">
              {places.map((p, i) => (
                <div key={i} className="ai-course-place-item">
                  <span className="ai-course-place-num">{i + 1}</span>
                  <div className="ai-course-place-info">
                    <span className="ai-course-place-name">{p.name}</span>
                    <span className="ai-course-place-reason">{p.reason}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="ai-course-detail-btn"
              onClick={() => navigate(`/courses/${active.COURSE_NUM}`)}
            >
              코스 상세 보기 →
            </button>
          </div>

          <div className="ai-course-card-right">
            {(active.COVER_IMAGE || active.thumbnailImage) ? (
              <img
                src={active.COVER_IMAGE || active.thumbnailImage}
                alt={active.TITLE}
                className="ai-course-card-img"
              />
            ) : (
              <div className="ai-course-card-img-placeholder">
                <span>🍞</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
