/* ===================================================
   CourseComplete 컴포넌트 (코스 완성 페이지)
   - 코스 만들기를 완료한 후 보이는 축하 페이지
   - CreateCourse에서 넘어온 데이터를 표시
   =================================================== */

import { useNavigate, useLocation } from 'react-router-dom';
import './CourseComplete.css';

export default function CourseComplete() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- CreateCourse에서 넘겨받은 데이터 --- */
  const location = useLocation();
  const courseData = location.state;

  /* 데이터가 없으면 (직접 URL 접근) 코스 만들기로 이동 */
  if (!courseData) {
    return (
      <div className="course-complete">
        <div className="cc-celebration">
          <div className="cc-check-circle"><span>!</span></div>
          <h1 className="cc-congrats-title">코스 데이터가 없어요</h1>
          <p className="cc-congrats-subtitle">코스 만들기에서 발행해주세요</p>
          <button
            className="cc-next-card"
            onClick={() => navigate('/create')}
            style={{ marginTop: '20px', padding: '12px 24px' }}
          >
            코스 만들기로 이동
          </button>
        </div>
      </div>
    );
  }

  const { courseNum, title, description, places, placeComments } = courseData;

  return (
    <div className="course-complete">

      {/* ===== 1. 축하 메시지 ===== */}
      <div className="cc-celebration">
        <div className="cc-check-circle">
          <span>✓</span>
        </div>
        <h1 className="cc-congrats-title">코스가 완성되었어요! 🎉</h1>
        <p className="cc-congrats-subtitle">멋진 빵지순례 코스가 완성되었습니다</p>
      </div>

      {/* ===== 2. 코스 요약 카드 ===== */}
      <div className="cc-summary-card">
        <div className="cc-summary-hero">
          <span>🍞</span>
        </div>
        <div className="cc-summary-body">
          <h2 className="cc-summary-title">{title}</h2>
          <p className="cc-summary-desc">{description || '나만의 빵지순례 코스'}</p>

          <div className="cc-summary-chips">
            <span className="cc-summary-chip">📍 {places.length}곳</span>
            <span className="cc-summary-chip">📅 {new Date().toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      {/* ===== 3. 통계 미리보기 ===== */}
      <div className="cc-stats">
        <div className="cc-stat-card">
          <span className="cc-stat-label">장소</span>
          <span className="cc-stat-value">{places.length}곳</span>
        </div>
      </div>

      {/* ===== 4. 코스 장소 목록 ===== */}
      <div className="cc-place-section">
        <h2 className="cc-section-title">코스 장소 목록</h2>
        {places.map((place, index) => (
          <div key={place.id} className="cc-place-item">
            <div className={`cc-place-num cc-num-${index + 1}`}>{index + 1}</div>
            <div className="cc-place-info">
              <span className="cc-place-name">{place.name}</span>
              <span className="cc-place-menu">{placeComments?.[place.id] || place.address}</span>
            </div>
            <div className="cc-place-img">
              <span>🍞</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 5. 다음 단계 ===== */}
      <div className="cc-next-section">
        <h2 className="cc-section-title">다음 단계</h2>
        <div className="cc-next-grid">
          <button
            className="cc-next-card"
            onClick={() => navigate(`/courses/${courseNum}`)}
          >
            <span className="cc-next-icon">👀</span>
            <span className="cc-next-label">내 코스 보기</span>
          </button>
          <button
            className="cc-next-card"
            onClick={() => navigate('/create')}
          >
            <span className="cc-next-icon">✨</span>
            <span className="cc-next-label">새 코스 만들기</span>
          </button>
          <button
            className="cc-next-card"
            onClick={() => navigate('/courses')}
          >
            <span className="cc-next-icon">📋</span>
            <span className="cc-next-label">코스 목록</span>
          </button>
          <button
            className="cc-next-card"
            onClick={() => navigate('/')}
          >
            <span className="cc-next-icon">🏠</span>
            <span className="cc-next-label">홈으로 돌아가기</span>
          </button>
        </div>
      </div>

    </div>
  );
}
