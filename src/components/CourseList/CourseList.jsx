/* ===================================================
   CourseList 컴포넌트 (추천코스 목록 페이지)
   - 다른 사람들이 만든 빵지순례 코스를 모아보는 페이지
   - 구성:
     1) 페이지 제목 + 설명
     2) 정렬/필터 바 (인기순, 최신순 등 + 지역 필터)
     3) 코스 카드 그리드 (2열)
     4) 더보기 버튼
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseList.css';

export default function CourseList() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */

  /* 현재 선택한 정렬 방식 */
  const [sortBy, setSortBy] = useState('popular');

  /* 현재 선택한 지역 필터 */
  const [activeRegion, setActiveRegion] = useState('전체');

  /* 보여줄 코스 개수: 처음에는 4개만 보여주고, "더보기" 누르면 4개씩 추가 */
  const [visibleCount, setVisibleCount] = useState(4);

  /* --- 정렬 옵션들 --- */
  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'latest', label: '최신순' },
    { value: 'rating', label: '별점순' },
    { value: 'scrap', label: '스크랩순' },
  ];

  /* --- 지역 필터 --- */
  const regions = [
    '전체', '마포구', '종로구', '중구', '성동구',
    '강남구', '서초구', '용산구', '송파구',
  ];

  /* --- 코스 더미 데이터 --- */
  /* 나중에 백엔드 API에서 받아올 예정 */
  const courses = [
    {
      id: 1,
      title: '연남동 빵지순례 코스',
      description: '연남동 골목골목 숨어있는 빵집들을 찾아가는 코스',
      author: '빵순이',
      region: '마포구',
      placeCount: 4,
      distance: '1.8km',
      duration: '2시간 30분',
      likes: 234,
      scraps: 89,
      rating: 4.8,
      tags: ['소금빵', '크루아상', '연남동'],
    },
    {
      id: 2,
      title: '을지로 레트로 빵투어',
      description: '을지로 옛 골목에서 만나는 전통 빵집과 새로운 베이커리',
      author: '빵덕후',
      region: '중구',
      placeCount: 5,
      distance: '2.3km',
      duration: '3시간',
      likes: 412,
      scraps: 156,
      rating: 4.9,
      tags: ['전통빵집', '을지로', '레트로'],
    },
    {
      id: 3,
      title: '성수동 디저트 산책',
      description: '성수동 카페거리에서 즐기는 디저트 코스',
      author: '디저트러버',
      region: '성동구',
      placeCount: 3,
      distance: '1.2km',
      duration: '1시간 30분',
      likes: 178,
      scraps: 67,
      rating: 4.6,
      tags: ['디저트', '성수동', '카페'],
    },
    {
      id: 4,
      title: '종로 전통 빵집 투어',
      description: '수십 년 전통의 빵집들을 돌아보는 클래식 코스',
      author: '빵매니아',
      region: '종로구',
      placeCount: 4,
      distance: '2.0km',
      duration: '2시간',
      likes: 356,
      scraps: 134,
      rating: 4.7,
      tags: ['전통빵집', '종로', '버터케이크'],
    },
    {
      id: 5,
      title: '합정 브런치 코스',
      description: '합정역 근처 브런치 맛집과 베이커리 모음',
      author: '브런치맨',
      region: '마포구',
      placeCount: 3,
      distance: '1.5km',
      duration: '2시간',
      likes: 145,
      scraps: 52,
      rating: 4.5,
      tags: ['브런치', '합정', '베이커리'],
    },
    {
      id: 6,
      title: '압구정 프리미엄 디저트',
      description: '압구정 로데오에서 만나는 프리미엄 디저트 코스',
      author: '스위트걸',
      region: '강남구',
      placeCount: 4,
      distance: '1.6km',
      duration: '2시간 30분',
      likes: 267,
      scraps: 98,
      rating: 4.7,
      tags: ['마카롱', '압구정', '프리미엄'],
    },
    {
      id: 7,
      title: '이태원 글로벌 베이커리',
      description: '세계 각국의 빵을 맛볼 수 있는 이태원 코스',
      author: '세계빵투어',
      region: '용산구',
      placeCount: 5,
      distance: '2.1km',
      duration: '3시간',
      likes: 189,
      scraps: 73,
      rating: 4.6,
      tags: ['이태원', '글로벌', '바게트'],
    },
    {
      id: 8,
      title: '잠실 빵 맛집 투어',
      description: '잠실 롯데월드몰 주변 인기 베이커리 코스',
      author: '송파빵집',
      region: '송파구',
      placeCount: 3,
      distance: '1.3km',
      duration: '1시간 30분',
      likes: 123,
      scraps: 45,
      rating: 4.4,
      tags: ['잠실', '쇼핑몰', '베이커리'],
    },
  ];

  /* --- 오늘의 추천코스 (좋아요 + 스크랩 합산 상위 3개) --- */
  /* 나중에 백엔드 API에서 별도 엔드포인트로 받아올 예정 */
  /* 상위 5개를 뽑아서 가로 스크롤로 보여줌 */
  const todayPicks = [...courses]
    .sort((a, b) => (b.likes + b.scraps) - (a.likes + a.scraps))
    .slice(0, 5);

  /* --- 필터링 + 정렬 로직 --- */

  /* 1단계: 지역 필터 적용 */
  const filtered = courses.filter((c) =>
    activeRegion === '전체' || c.region === activeRegion
  );

  /* 2단계: 정렬 적용 */
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return b.likes - a.likes;       /* 좋아요 많은 순 */
    if (sortBy === 'latest') return b.id - a.id;              /* 최신(id 큰 순) */
    if (sortBy === 'rating') return b.rating - a.rating;      /* 별점 높은 순 */
    if (sortBy === 'scrap') return b.scraps - a.scraps;       /* 스크랩 많은 순 */
    return 0;
  });

  return (
    <div className="course-list">

      {/* ===== 1. 페이지 헤더 ===== */}
      <div className="cl-header">
        <h1 className="cl-title">추천 코스</h1>
        <p className="cl-subtitle">다른 빵순이들이 만든 빵지순례 코스를 구경해보세요</p>
      </div>

      {/* ===== 2. 오늘의 추천코스 ===== */}
      {/* 좋아요 + 스크랩 합산 상위 3개를 가로 스크롤 카드로 보여줌 */}
      <div className="cl-today-section">
        <h2 className="cl-today-title">오늘의 추천 코스</h2>
        <div className="cl-today-list">
          {todayPicks.map((course, index) => (
            <div
              key={course.id}
              className="cl-today-card"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              {/* 순위 뱃지 */}
              <div className="cl-today-rank">{index + 1}</div>
              {/* 썸네일 */}
              <div className="cl-today-thumb">
                <span>🍞</span>
              </div>
              {/* 코스 정보 */}
              <div className="cl-today-info">
                <span className="cl-today-region">{course.region}</span>
                <h3 className="cl-today-name">{course.title}</h3>
                <p className="cl-today-desc">{course.description}</p>
                <div className="cl-today-stats">
                  <span>❤️ {course.likes}</span>
                  <span>🔖 {course.scraps}</span>
                  <span>★ {course.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3. 필터 + 정렬 바 ===== */}
      <div className="cl-toolbar">

        {/* 지역 필터 태그들 */}
        <div className="cl-region-tags">
          {regions.map((r) => (
            <button
              key={r}
              className={`cl-region-tag ${activeRegion === r ? 'active' : ''}`}
              onClick={() => {
                setActiveRegion(r);
                /* 지역 필터가 바뀌면 보여줄 개수를 다시 4개로 초기화 */
                setVisibleCount(4);
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* 정렬 + 결과 개수 */}
        <div className="cl-sort-row">
          <span className="cl-result-count">
            총 <strong>{sorted.length}</strong>개 코스
          </span>
          <div className="cl-sort-buttons">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                className={`cl-sort-btn ${sortBy === opt.value ? 'active' : ''}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 3. 코스 카드 그리드 ===== */}
      {/* sorted 배열에서 visibleCount 개수만큼만 잘라서 보여줌 */}
      {/* 예: visibleCount=4 → 처음 4개만 보임, 8이면 8개 보임 */}
      <div className="cl-grid">
        {sorted.slice(0, visibleCount).map((course) => (
          <div
            key={course.id}
            className="cl-card"
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            {/* 카드 상단: 썸네일 이미지 (임시) */}
            <div className="cl-card-thumb">
              <span>🍞</span>
              {/* 장소 개수 뱃지 */}
              <div className="cl-card-badge">{course.placeCount}곳</div>
            </div>

            {/* 카드 하단: 코스 정보 */}
            <div className="cl-card-body">
              {/* 지역 태그 */}
              <span className="cl-card-region">{course.region}</span>

              {/* 코스 제목 */}
              <h3 className="cl-card-title">{course.title}</h3>

              {/* 코스 설명 (1줄만) */}
              <p className="cl-card-desc">{course.description}</p>

              {/* 태그 칩들 */}
              <div className="cl-card-tags">
                {course.tags.map((tag, i) => (
                  <span key={i} className="cl-card-tag">#{tag}</span>
                ))}
              </div>

              {/* 거리 + 소요시간 */}
              <div className="cl-card-meta">
                <span>🚶 {course.distance}</span>
                <span>🕐 {course.duration}</span>
              </div>

              {/* 하단: 작성자 + 좋아요/스크랩 */}
              <div className="cl-card-footer">
                <span className="cl-card-author">by {course.author}</span>
                <div className="cl-card-stats">
                  <span>❤️ {course.likes}</span>
                  <span>🔖 {course.scraps}</span>
                  <span>★ {course.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 4. 더보기 버튼 ===== */}
      {/* 아직 안 보여준 코스가 남아있을 때만 버튼을 표시 */}
      {visibleCount < sorted.length && (
        <div className="cl-more-wrap">
          <button
            className="cl-more-btn"
            onClick={() => {
              /* 버튼을 누르면 보여줄 개수를 4개 더 늘림 */
              setVisibleCount((prev) => prev + 4);
            }}
          >
            더 많은 코스 보기 ({sorted.length - visibleCount}개 더)
          </button>
        </div>
      )}
    </div>
  );
}
