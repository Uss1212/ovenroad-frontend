import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCourseList, getAiCourseList, toggleCourseScrap, BASE_URL } from '../../api/apiAxios';
import './CourseList.css';

export default function CourseList() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterUserNum = searchParams.get('userNum');
  const filterAuthor = searchParams.get('author');

  const [activeTab, setActiveTab] = useState('일반');
  const [activeSort, setActiveSort] = useState('인기순');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [scrappedSet, setScrappedSet] = useState(new Set());
  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;

  const handleScrap = async (e, courseNum) => {
    e.stopPropagation();
    if (!currentUser) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
    try {
      const res = await toggleCourseScrap(courseNum, currentUser.userNum);
      setScrappedSet(prev => {
        const next = new Set(prev);
        if (res.scraped) next.add(courseNum);
        else next.delete(courseNum);
        return next;
      });
    } catch (err) {
      console.error('스크랩 실패:', err);
    }
  };

  const sortOptions = ['최신순', '인기순', '좋아요순'];

  const getSortParam = (sort) => {
    if (sort === '인기순') return 'popular';
    if (sort === '좋아요순') return 'popular';
    return 'latest';
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        let data;
        if (activeTab === 'AI') {
          data = await getAiCourseList(true);
        } else {
          const [normal, ai] = await Promise.all([
            getCourseList(getSortParam(activeSort), '', filterUserNum || ''),
            getAiCourseList(true),
          ]);
          const aiNums = new Set(ai.map(c => c.COURSE_NUM));
          data = [...normal.filter(c => !aiNums.has(c.COURSE_NUM)), ...ai];
        }
        setCourses(data);
      } catch (err) {
        console.error('코스 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [activeSort, activeTab, filterUserNum]);

  const getImageUrl = (course) => {
    const toUrl = (s) => s?.startsWith('http') ? s : `${BASE_URL}${s}`;
    const src = course.COVER_IMAGE || course.thumbnailImage;
    if (!src) return null;
    try {
      const parsed = JSON.parse(src);
      return toUrl(Array.isArray(parsed) ? parsed[0] : src);
    } catch {
      return toUrl(src);
    }
  };

  return (
    <div className="explore-page">
      <div className="explore-container">

        <div className="explore-header">
          <button className="explore-back-btn" onClick={() => navigate(-1)}>‹</button>
          <h1 className="explore-title">
            {filterAuthor ? `${filterAuthor}님의 코스` : '코스 전체'}
          </h1>
        </div>

        <div className="explore-sort-row" style={{ position: 'relative' }}>
          <button
            className="explore-sort-btn"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
          >
            {activeTab === 'AI' ? '✦ AI 추천' : activeSort} <span style={{ fontSize: 12 }}>▾</span>
          </button>
          {showSortDropdown && (
            <div className="explore-sort-dropdown">
              <button
                className={`explore-sort-option ${activeTab === '일반' && activeSort === '인기순' ? 'active' : ''}`}
                onClick={() => { setActiveTab('일반'); setActiveSort('인기순'); setShowSortDropdown(false); setVisibleCount(8); }}
              >전체</button>
              <button
                className={`explore-sort-option ${activeTab === 'AI' ? 'active' : ''}`}
                onClick={() => { setActiveTab('AI'); setShowSortDropdown(false); setVisibleCount(8); }}
              >✦ AI 추천</button>
              {sortOptions.map((s) => (
                <button
                  key={s}
                  className={`explore-sort-option ${activeTab === '일반' && activeSort === s ? 'active' : ''}`}
                  onClick={() => { setActiveTab('일반'); setActiveSort(s); setShowSortDropdown(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="explore-loading">
            <span className="explore-loading-icon">🍞</span>
            <p>코스를 불러오는 중...</p>
          </div>
        )}

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
          {courses.slice(0, visibleCount).map((course) => {
            const imgUrl = getImageUrl(course);
            const tags = [];
            if (course.tags) {
              try {
                const parsed = typeof course.tags === 'string' ? JSON.parse(course.tags) : course.tags;
                if (Array.isArray(parsed)) tags.push(...parsed);
              } catch {}
            }

            return (
              <div
                key={course.COURSE_NUM}
                className="explore-card"
                onClick={() => navigate(`/courses/${course.COURSE_NUM}`)}
              >
                <div className="explore-card-img">
                  {course.IS_AI === 1 && (
                    <span className="explore-card-ai-badge">✦ AI 추천</span>
                  )}
                  <button
                    className={`explore-card-bookmark ${scrappedSet.has(course.COURSE_NUM) ? 'active' : ''}`}
                    onClick={(e) => handleScrap(e, course.COURSE_NUM)}
                  >
                    <i className={scrappedSet.has(course.COURSE_NUM) ? 'fi fi-ss-bookmark' : 'fi fi-rs-bookmark'}></i>
                  </button>
                  {imgUrl ? (
                    <img src={imgUrl} alt={course.TITLE} className="explore-card-photo" />
                  ) : (
                    <div className="explore-card-placeholder">
                      <span>🍞</span>
                    </div>
                  )}
                </div>

                <div className="explore-card-body">
                  <h3 className="explore-card-title">{course.TITLE}</h3>
                  <p className="explore-card-subtitle">{course.SUBTITLE || ''}</p>
                  <div className="explore-card-likes">
                    <span>❤️</span> {course.likeCount || 0}
                  </div>
                  <div className="explore-card-tags">
                    {tags.length > 0 ? (
                      tags.slice(0, 4).map((t, i) => (
                        <span key={i} className="explore-card-tag">#{t}</span>
                      ))
                    ) : (
                      <>
                        <span className="explore-card-tag">#{course.IS_AI === 1 ? 'AI추천' : (course.author || '코스')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
