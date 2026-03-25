/* ===================================================
   PlaceList 컴포넌트 (빵집 탐색 페이지)
   - 메뉴 태그 검색 (크로와상, 소금빵 등)
   - 빵집 카드에 시그니처 메뉴 태그 표시
   - 정렬 + 지역 필터 + 검색 + 카드 + 더보기
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_URL } from '../../api/api';
import './PlaceList.css';

export default function PlaceList() {

  const navigate = useNavigate();

  /* URL에서 검색 파라미터 읽기 (?search=검색어 또는 ?menu=크로와상) */
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlMenu = searchParams.get('menu') || '';

  /* 검색어 상태 */
  const [searchKeyword, setSearchKeyword] = useState(urlSearch);

  /* 선택된 메뉴 태그 (null이면 전체) */
  const [activeMenuTag, setActiveMenuTag] = useState(urlMenu || null);

  /* 백엔드에서 불러온 빵집 데이터 */
  const [bakeries, setBakeries] = useState([]);

  /* 인기 메뉴 태그 목록 (백엔드에서 가져옴) */
  const [menuTags, setMenuTags] = useState([]);

  /* 로딩 상태 */
  const [loading, setLoading] = useState(true);

  /* 현재 선택한 정렬 방식 */
  const [activeSort, setActiveSort] = useState('인기순');

  /* 보여줄 빵집 개수 */
  const [visibleCount, setVisibleCount] = useState(12);

  /* URL 검색어가 바뀌면 반영 */
  useEffect(() => {
    if (urlSearch) setSearchKeyword(urlSearch);
  }, [urlSearch]);

  /* URL 메뉴 태그가 바뀌면 반영 */
  useEffect(() => {
    if (urlMenu) setActiveMenuTag(urlMenu);
  }, [urlMenu]);

  /* 정렬 옵션 */
  const sortOptions = ['인기순', '최신순', '별점순'];


  /* --- 인기 메뉴 태그 가져오기 (DB에서 많이 등록된 메뉴) --- */
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch(`${BASE_URL}/api/places/tags`);
        if (res.ok) {
          const data = await res.json();
          setMenuTags(data);
        }
      } catch (err) {
        console.error('태그 불러오기 실패:', err);
        /* 태그 못 가져와도 페이지는 정상 작동 */
      }
    }
    fetchTags();
  }, []);

  /* --- 빵집 데이터 가져오기 (메뉴 태그 필터 포함) --- */
  useEffect(() => {
    async function fetchBakeries() {
      try {
        setLoading(true);
        /* API 호출 시 메뉴 태그가 선택되면 menu 파라미터 추가 */
        let url = `${BASE_URL}/api/places`;
        const queryParts = [];
        if (activeMenuTag) queryParts.push(`menu=${encodeURIComponent(activeMenuTag)}`);
        if (queryParts.length > 0) url += '?' + queryParts.join('&');

        const res = await fetch(url);
        const data = await res.json();

        /* API 데이터를 프론트엔드 형식으로 변환 */
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .map((p) => {
            /* 주소에서 "구" 이름 추출 */
            const regionMatch = p.ADDRESS?.match(/([\uAC00-\uD7A3]+구)/);
            const region = regionMatch ? regionMatch[1] : '';

            /* menuTags: 서버에서 "크로와상,식빵,소금빵" 형태로 옴 → 배열로 변환 */
            const tags = p.menuTags ? p.menuTags.split(',').slice(0, 3) : [];

            return {
              id: p.PLACE_NUM,
              name: p.PLACE_NAME,
              address: p.ADDRESS || '',
              region: region,
              rating: p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0',
              reviewCount: p.reviewCount || 0,
              hasRibbon: p.ribbonCount && p.ribbonCount > 0,
              image: p.thumbnailImage || null,
              menuTags: tags,
            };
          });

        setBakeries(mapped);
      } catch (err) {
        console.error('빵집 데이터 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBakeries();
  }, [activeMenuTag]);

  /* --- 필터링 + 정렬 --- */
  const filteredBakeries = bakeries
    /* 1) 검색어 필터: 이름, 주소, 메뉴 태그에 포함된 빵집 */
    .filter(b => {
      if (!searchKeyword) return true;
      const keyword = searchKeyword.toLowerCase();
      return b.name.toLowerCase().includes(keyword) ||
             b.address.toLowerCase().includes(keyword) ||
             b.menuTags.some(t => t.toLowerCase().includes(keyword));
    })
    /* 3) 정렬 */
    .sort((a, b) => {
      if (activeSort === '인기순') return b.reviewCount - a.reviewCount;
      if (activeSort === '별점순') return parseFloat(b.rating) - parseFloat(a.rating);
      return b.id - a.id;
    });

  /* 메뉴 태그 클릭 핸들러 */
  const handleTagClick = (tagName) => {
    if (activeMenuTag === tagName) {
      /* 이미 선택된 태그를 다시 클릭하면 해제 */
      setActiveMenuTag(null);
    } else {
      setActiveMenuTag(tagName);
    }
    setVisibleCount(12);
  };

  return (
    <div className="pl-page">
      <div className="pl-container">

        {/* ===== 1. 헤더 ===== */}
        <div className="pl-header">
          <h1 className="pl-title">
            {activeMenuTag ? `"${activeMenuTag}" 맛집` : '인기있는 빵집'}
          </h1>
          <p className="pl-subtitle">
            {activeMenuTag
              ? `${activeMenuTag} 메뉴가 있는 빵집들을 모아봤어요`
              : '서울의 맛있는 빵집들을 만나보세요'}
          </p>
        </div>

        {/* ===== 검색바 ===== */}
        <div className="pl-search-bar">
          <span className="pl-search-icon">🔍</span>
          <input
            type="text"
            className="pl-search-input"
            placeholder="빵집 이름, 지역, 메뉴를 검색해보세요 (예: 크로와상)"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setVisibleCount(12);
            }}
          />
          {searchKeyword && (
            <button className="pl-search-clear" onClick={() => setSearchKeyword('')}>
              ✕
            </button>
          )}
        </div>

        {/* ===== 인기 메뉴 태그 ===== */}
        {menuTags.length > 0 && (
          <div className="pl-tag-section">
            <p className="pl-tag-label">인기 메뉴</p>
            <div className="pl-tag-list">
              {menuTags.slice(0, 15).map((tag) => (
                <button
                  key={tag.name}
                  className={`pl-tag-btn ${activeMenuTag === tag.name ? 'active' : ''}`}
                  onClick={() => handleTagClick(tag.name)}
                >
                  🏷️ {tag.name}
                  <span className="pl-tag-count">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== 정렬 버튼 ===== */}
        <div className="pl-filter-area">
          <div className="pl-sort-group">
            {sortOptions.map((s) => (
              <button
                key={s}
                className={`pl-sort-btn ${activeSort === s ? 'active' : ''}`}
                onClick={() => setActiveSort(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 개수 + 선택된 태그 표시 */}
        <div className="pl-result-row">
          <p className="pl-result-count">
            총 <strong>{filteredBakeries.length}</strong>개의 빵집
          </p>
          {activeMenuTag && (
            <button className="pl-tag-clear" onClick={() => setActiveMenuTag(null)}>
              ✕ "{activeMenuTag}" 태그 해제
            </button>
          )}
        </div>

        {/* ===== 로딩 ===== */}
        {loading && (
          <div className="pl-loading">
            <span className="pl-loading-icon">🍞</span>
            <p>빵집을 불러오는 중...</p>
          </div>
        )}

        {/* ===== 빵집 카드 그리드 ===== */}
        {!loading && (
          <div className="pl-grid">
            {filteredBakeries.slice(0, visibleCount).map((bakery) => (
              <div
                key={bakery.id}
                className="pl-card"
                onClick={() => navigate(`/place/${bakery.id}`)}
              >
                {/* 카드 이미지 */}
                <div className="pl-card-img">
                  {bakery.image ? (
                    <img
                      src={bakery.image.startsWith('http') ? bakery.image : `${BASE_URL}${bakery.image}`}
                      alt={bakery.name}
                      className="pl-card-photo"
                    />
                  ) : (
                    <div className="pl-card-placeholder">
                      <span>🍞</span>
                    </div>
                  )}

                  {bakery.hasRibbon && (
                    <span className="pl-card-ribbon">🎀 블루리본</span>
                  )}
                </div>

                {/* 카드 하단 정보 */}
                <div className="pl-card-body">
                  <h3 className="pl-card-name">{bakery.name}</h3>
                  <p className="pl-card-address">{bakery.address}</p>

                  {/* 메뉴 태그 (최대 3개) */}
                  {bakery.menuTags.length > 0 && (
                    <div className="pl-card-tags">
                      {bakery.menuTags.map((tag, i) => (
                        <span key={i} className="pl-card-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* 별점 + 지역 */}
                  <div className="pl-card-bottom">
                    <span className="pl-card-rating">
                      ⭐ {bakery.rating}
                      <span className="pl-card-review-count">({bakery.reviewCount})</span>
                    </span>
                    {bakery.region && (
                      <span className="pl-card-region">#{bakery.region}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== 더보기 ===== */}
        {!loading && visibleCount < filteredBakeries.length && (
          <div className="pl-load-more">
            <button
              className="pl-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 8)}
            >
              더보기 ({visibleCount}/{filteredBakeries.length})
            </button>
          </div>
        )}

        {/* ===== 검색 결과 없음 ===== */}
        {!loading && filteredBakeries.length === 0 && (
          <div className="pl-empty">
            <span className="pl-empty-icon">🔍</span>
            <p className="pl-empty-title">
              {searchKeyword
                ? `"${searchKeyword}" 검색 결과가 없어요`
                : activeMenuTag
                  ? `"${activeMenuTag}" 메뉴를 가진 빵집이 없어요`
                  : '해당 지역에 등록된 빵집이 없어요'}
            </p>
            <p className="pl-empty-desc">다른 검색어나 태그를 시도해보세요</p>
            <button
              className="pl-empty-btn"
              onClick={() => {
                setSearchKeyword('');
                setActiveMenuTag(null);
              }}
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
