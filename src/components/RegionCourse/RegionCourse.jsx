import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseList, BASE_URL } from '../../api/apiAxios';
import './RegionCourse.css';

const REGIONS = [
  { label: '서울 전체', value: '' },
  { label: '강남구',    value: '강남구' },
  { label: '마포구',    value: '마포구' },
  { label: '용산구',    value: '용산구' },
  { label: '서대문구',  value: '서대문구' },
  { label: '성동구',    value: '성동구' },
  { label: '종로구',    value: '종로구' },
  { label: '송파구',    value: '송파구' },
  { label: '홍대/합정', value: '홍대' },
];

export default function RegionCourse() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getCourseList('popular', region)
      .then(data => setCourses(data.slice(0, 6)))
      .catch(err => console.error('지역 코스 불러오기 실패:', err));
  }, [region]);

  const featured = courses[0] || null;
  const listCourses = courses.slice(1, 6);

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

  const getTags = (course, max = 4) => {
    if (!course.TAGS) return [];
    try {
      const parsed = typeof course.TAGS === 'string' ? JSON.parse(course.TAGS) : course.TAGS;
      return Array.isArray(parsed) ? parsed.slice(0, max) : [];
    } catch { return []; }
  };

  const selectedLabel = REGIONS.find(r => r.value === region)?.label || '서울 전체';
  const featuredThumb = getThumbnail(featured);
  const featuredAvatar = getAuthorAvatar(featured);
  const featuredAuthor = featured.author || featured.NICKNAME || '작성자';
  const featuredTags = getTags(featured, 4);

  return (
    <section className="rc-section">
      <div className="rc-inner">

        {/* ── 헤더 ── */}
        <div className="rc-header">
          <div className="rc-header-left">
            {/* 지역 셀렉터 */}
            <div className="rc-region-wrap">
              <select
                className="rc-region-select"
                value={region}
                onChange={e => setRegion(e.target.value)}
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <span className="rc-region-arrow">▼</span>
            </div>
            <h2 className="rc-title">
              <span className="rc-title-region">{selectedLabel}</span> 추천 코스
            </h2>
          </div>
          <button
            className="rc-more"
            onClick={() => navigate(region ? `/courses?region=${encodeURIComponent(region)}` : '/courses')}
          >
            View more <i className="fi fi-rr-caret-right rc-more-arrow"></i>
          </button>
        </div>

        {/* ── 본문: 좌(피처드) + 우(리스트) ── */}
        {!featured ? (
          <div className="rc-empty">해당 지역의 추천 코스가 없습니다.</div>
        ) : (
        <div className="rc-body">

          {/* 왼쪽: 대표 코스 */}
          <div
            className="rc-featured"
            onClick={() => navigate(`/courses/${featured.COURSE_NUM}`)}
          >
            <div
              className="rc-featured-img"
              style={{ backgroundImage: featuredThumb ? `url(${featuredThumb})` : undefined }}
            >
              {!featuredThumb && <span className="rc-featured-placeholder">🍞</span>}

              {/* 1위 뱃지 */}
              <span className="rc-featured-rank">1</span>

              {/* 작성자 아바타 */}
              <div className="rc-featured-avatar">
                {featuredAvatar
                  ? <img src={featuredAvatar} alt={featuredAuthor} />
                  : <span>{featuredAuthor.charAt(0)}</span>}
              </div>
            </div>

            <div className="rc-featured-body">
              <h3 className="rc-featured-title">{featured.TITLE}</h3>
              {featured.SUBTITLE && (
                <p className="rc-featured-subtitle">{featured.SUBTITLE}</p>
              )}
              <div className="rc-featured-meta">
                <span className="rc-featured-like">
                  <span className="rc-like-icon">❤</span>
                  {featured.likeCount || 0}
                </span>
                {featuredTags.length > 0 && (
                  <div className="rc-featured-tags">
                    {featuredTags.map(tag => (
                      <span key={tag} className="rc-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 순위 리스트 */}
          <div className="rc-list">
            {listCourses.length === 0 ? (
              <div className="rc-list-empty">이 지역의 다른 추천 코스가 없습니다.</div>
            ) : listCourses.map((course, i) => {
              const thumb = getThumbnail(course);
              const tags = getTags(course, 3);
              return (
                <div
                  key={course.COURSE_NUM}
                  className="rc-list-item"
                  onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
                >
                  <span className="rc-list-num">{i + 2}</span>

                  <div
                    className="rc-list-thumb"
                    style={{ backgroundImage: thumb ? `url(${thumb})` : undefined }}
                  >
                    {!thumb && <span>🍞</span>}
                  </div>

                  <div className="rc-list-info">
                    <p className="rc-list-name">{course.TITLE}</p>
                    {course.SUBTITLE && (
                      <p className="rc-list-sub">{course.SUBTITLE}</p>
                    )}
                    <div className="rc-list-meta">
                      <span className="rc-list-rating">
                        <span className="rc-star-icon">⭐</span>
                        {course.avgRating ? Number(course.avgRating).toFixed(1) : (course.likeCount || 0)}
                      </span>
                      {tags.length > 0 && (
                        <div className="rc-list-tags">
                          {tags.map(tag => (
                            <span key={tag} className="rc-list-tag">#{tag}</span>
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
        )}
      </div>
    </section>
  );
}
