/* ===================================================
   CourseComplete 컴포넌트 (코스 완성 페이지)
   - 코스 만들기를 완료한 후 보이는 축하 페이지
   - 구성:
     1) 축하 메시지 (체크 아이콘 + 제목 + 설명)
     2) 코스 요약 카드 (히어로 이미지 + 제목 + 설명 + 태그칩)
     3) 통계 미리보기 (장소 수, 거리, 소요시간 카드)
     4) 지도 미리보기 (마커 표시)
     5) 코스 장소 목록 (번호 + 이름 + 추천메뉴 + 이미지)
     6) 공유하기 섹션 (SNS 공유 버튼들)
     7) 다음 단계 (미리보기, 새 코스, 수정, 홈으로)
   =================================================== */

import { useNavigate } from 'react-router-dom';
import './CourseComplete.css';

export default function CourseComplete() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 코스 더미 데이터 --- */
  // 나중에 코스 만들기에서 넘어온 데이터를 사용
  const course = {
    title: '나만의 연남동 빵지순례',
    description: '연남동의 숨은 빵집들을 찾아가는 코스',
    detail: '연남동 골목골목 숨어있는 나만의 빵집들을 모아봤어요. 소금빵부터 크루아상, 당근케이크까지 다양한 빵을 맛볼 수 있는 코스입니다.',
    duration: '2시간 30분',
    distance: '1.8km',
    date: '2025.12.28',
  };

  /* --- 장소 더미 데이터 --- */
  const places = [
    { id: 1, name: '바로 베이커리', menu: '소금빵' },
    { id: 2, name: '르뚝 연남', menu: '크루아상' },
    { id: 3, name: '오월의 빵', menu: '당근케이크' },
    { id: 4, name: '카페 공명', menu: '휘낭시에 / 잠라라' },
  ];

  return (
    <div className="course-complete">

      {/* ===== 1. 축하 메시지 ===== */}
      <div className="cc-celebration">
        {/* 체크 아이콘 (큰 원형) */}
        <div className="cc-check-circle">
          <span>✓</span>
        </div>
        <h1 className="cc-congrats-title">코스가 완성되었어요! 🎉</h1>
        <p className="cc-congrats-subtitle">멋진 빵지순례 코스가 완성되었습니다</p>
      </div>

      {/* ===== 2. 코스 요약 카드 ===== */}
      <div className="cc-summary-card">
        {/* 카드 상단: 히어로 이미지 */}
        <div className="cc-summary-hero">
          <span>이미지</span>
        </div>
        {/* 카드 하단: 코스 정보 */}
        <div className="cc-summary-body">
          <h2 className="cc-summary-title">{course.title}</h2>
          <p className="cc-summary-desc">{course.description}</p>

          {/* 태그 칩들 */}
          <div className="cc-summary-chips">
            <span className="cc-summary-chip">🕐 약 {course.duration}</span>
            <span className="cc-summary-chip">🚶 도보 {course.distance}</span>
            <span className="cc-summary-chip">📍 {places.length}곳</span>
            <span className="cc-summary-chip">📅 {course.date}</span>
          </div>

          {/* 상세 설명 */}
          <p className="cc-summary-detail">{course.detail}</p>
        </div>
      </div>

      {/* ===== 3. 통계 미리보기 ===== */}
      <div className="cc-stats">
        <div className="cc-stat-card">
          <span className="cc-stat-label">장소</span>
          <span className="cc-stat-value">{places.length}곳</span>
        </div>
        <div className="cc-stat-card">
          <span className="cc-stat-label">거리</span>
          <span className="cc-stat-value">{course.distance}</span>
        </div>
        <div className="cc-stat-card">
          <span className="cc-stat-label">소요시간</span>
          <span className="cc-stat-value">{course.duration}</span>
        </div>
      </div>

      {/* ===== 4. 지도 미리보기 ===== */}
      <div className="cc-map-section">
        <div className="cc-map-area">
          <span>🗺️ 지도 미리보기</span>
          {places.map((place, index) => (
            <div
              key={place.id}
              className={`cc-map-marker cc-marker-${index + 1}`}
              style={{
                left: `${20 + index * 18}%`,
                top: `${35 + (index % 2 === 0 ? 0 : 20)}%`,
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* ===== 5. 코스 장소 목록 ===== */}
      <div className="cc-place-section">
        <h2 className="cc-section-title">코스 장소 목록</h2>
        {places.map((place, index) => (
          <div key={place.id} className="cc-place-item">
            {/* 순서 번호 */}
            <div className={`cc-place-num cc-num-${index + 1}`}>{index + 1}</div>
            {/* 장소 정보 */}
            <div className="cc-place-info">
              <span className="cc-place-name">{place.name}</span>
              <span className="cc-place-menu">추천메뉴: {place.menu}</span>
            </div>
            {/* 장소 이미지 (임시) */}
            <div className="cc-place-img">
              <span>🍞</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 6. 공유하기 ===== */}
      <div className="cc-share-section">
        <h2 className="cc-section-title">코스 공유하기</h2>
        <p className="cc-share-desc">친구들에게 나만의 코스를 공유해보세요!</p>
        <div className="cc-share-buttons">
          <button className="cc-share-btn cc-share-kakao">카카오톡</button>
          <button className="cc-share-btn cc-share-link">링크 복사</button>
          <button className="cc-share-btn cc-share-x">X (트위터)</button>
          <button className="cc-share-btn cc-share-insta">인스타그램</button>
        </div>
      </div>

      {/* ===== 7. 다음 단계 ===== */}
      <div className="cc-next-section">
        <h2 className="cc-section-title">다음 단계</h2>
        <div className="cc-next-grid">
          <button
            className="cc-next-card"
            onClick={() => navigate('/courses/1')}
          >
            <span className="cc-next-icon">👀</span>
            <span className="cc-next-label">내 코스 미리보기</span>
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
            onClick={() => navigate('/create')}
          >
            <span className="cc-next-icon">✏️</span>
            <span className="cc-next-label">코스 수정하기</span>
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
