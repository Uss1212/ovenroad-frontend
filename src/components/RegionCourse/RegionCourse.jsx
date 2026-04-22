/* ===================================================
   RegionCourse 컴포넌트 → Best 5
   - 메인 페이지에서 TodayCourse 바로 아래에 위치
   - 평점 높은 순으로 상위 5개 빵집을 카드로 보여줌
   - 사진 위에 순위 번호 표시
   - 백엔드 API에서 빵집 데이터를 가져옴
   =================================================== */

import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './RegionCourse.css';

export default function RegionCourse() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 스크롤 영역을 직접 조작하기 위한 ref --- */
  const scrollRef = useRef(null);

  /* --- DB에서 불러온 빵집 Best 5 데이터 --- */
  const [bakeries, setBakeries] = useState([]);

  /* --- 백엔드 API에서 평점 높은 순 Best 5 가져오기 --- */
  useEffect(() => {
    async function fetchBest5() {
      try {
        const res = await fetch(`${BASE_URL}/api/places`);
        const data = await res.json();

        /* 평점 높은 순 → 같으면 리뷰 많은 순으로 정렬, 상위 5개 */
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE && p.avgRating)
          .map(p => ({
            id: p.PLACE_NUM,
            name: p.PLACE_NAME,
            address: p.ADDRESS || '',
            rating: Number(p.avgRating).toFixed(1),
            reviewCount: p.reviewCount || 0,
            image: p.thumbnailImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
          }))
          .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
          .slice(0, 5);

        setBakeries(mapped);
      } catch (err) {
        console.error('Best 5 데이터 불러오기 실패:', err);
      }
    }
    fetchBest5();
  }, []);

  /* --- ◀ 왼쪽으로 스크롤 --- */
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  /* --- ▶ 오른쪽으로 스크롤 --- */
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="region-course">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="region-course-header">
        <div>
          <h2 className="region-course-title">Best 5</h2>
          <p className="region-course-subtitle">
            평점이 가장 높은 빵집 TOP 5
          </p>
        </div>
        <a
          href="/places"
          className="region-course-more"
          onClick={(e) => { e.preventDefault(); navigate('/places'); }}
        >
          View more →
        </a>
      </div>

      {/* ===== 카드 캐러셀 영역 ===== */}
      <div className="region-course-carousel">

        {/* ◀ 왼쪽 버튼 */}
        <button className="region-btn region-btn-left" onClick={scrollLeft}>
          ◀
        </button>

        {/* --- 카드 목록 (가로 스크롤) --- */}
        <div className="region-course-list" ref={scrollRef}>
          {bakeries.map((bakery, index) => (
            <div
              key={bakery.id}
              className="region-card"
              onClick={() => navigate(`/place/${bakery.id}`)}
              style={{ cursor: 'pointer' }}
            >

              {/* 카드 상단: 썸네일 이미지 + 순위 번호 */}
              <div className="region-card-img">
                <img
                  src={bakery.image}
                  alt={bakery.name}
                  className="region-card-photo"
                />
                {/* 순위 뱃지 */}
                <div className={`region-card-rank region-card-rank-${index + 1}`}>
                  {index + 1}
                </div>
              </div>

              {/* 카드 하단: 빵집 정보 */}
              <div className="region-card-body">
                <h3 className="region-card-title">{bakery.name}</h3>
                <div className="region-card-author">
                  <span>{bakery.address}</span>
                </div>
                <div className="region-card-stats">
                  <span>⭐ {bakery.rating}</span>
                  <span>💬 리뷰 {bakery.reviewCount}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* ▶ 오른쪽 버튼 */}
        <button className="region-btn region-btn-right" onClick={scrollRight}>
          ▶
        </button>

      </div>
    </section>
  );
}
