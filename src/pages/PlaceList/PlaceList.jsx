/* ===================================================
   PlaceList 컴포넌트 (빵집 탐색 페이지)
   - 메뉴 태그 검색 (크로와상, 소금빵 등)
   - 빵집 카드에 시그니처 메뉴 태그 표시
   - 정렬 + 지역 필터 + 검색 + 카드 + 더보기
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './PlaceList.css';

/* 이미지 없는 카드에 Google 사진을 lazy load */
function PlaceCardImage({ image, googlePlaceId, placeId, name }) {
  const [src, setSrc] = useState(image || null);

  useEffect(() => {
    if (src || !googlePlaceId || typeof placeId !== 'number') return;
    fetch(`${BASE_URL}/api/places/${placeId}/google-details`)
      .then(r => r.json())
      .then(data => { if (data.photoUrl) setSrc(data.photoUrl); })
      .catch(() => {});
  }, []);

  if (src) {
    return (
      <img
        src={src.startsWith('http') ? src : `${BASE_URL}${src}`}
        alt={name}
        className="pl-card-photo"
      />
    );
  }
  return <div className="pl-card-placeholder"><span>🍞</span></div>;
}

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

  /* Google Places에서 가져온 주변 베이커리 */
  const [externalBakeries, setExternalBakeries] = useState([]);

  /* 인기 메뉴 태그 목록 (백엔드에서 가져옴) */
  const [menuTags, setMenuTags] = useState([]);

  /* 로딩 상태 */
  const [loading, setLoading] = useState(true);

  /* 주변 베이커리 로딩 상태 */
  const [externalLoading, setExternalLoading] = useState(true);

  /* 사용자 위치 (거리순 정렬에 사용) */
  const [userCoords, setUserCoords] = useState(null);

  /* 현재 선택한 정렬 방식 */
  const [activeSort, setActiveSort] = useState('거리순');

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
  const sortOptions = ['거리순', '인기순', '최신순', '별점순'];

  /* 두 좌표 간 거리 계산 (Haversine, km 단위) */
  function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }


  /* --- 현재 위치 기반 주변 베이커리 가져오기 (Google Places) --- */
  useEffect(() => {
    async function fetchExternal(lat, lng) {
      try {
        setExternalLoading(true);
        const res = await fetch(`${BASE_URL}/api/places/nearby-bakeries?lat=${lat}&lng=${lng}&radius=5000`);
        const data = await res.json();
        setExternalBakeries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('주변 베이커리 불러오기 실패:', err);
      } finally {
        setExternalLoading(false);
      }
    }

    async function initLocation() {
      if (!navigator.geolocation) {
        setUserCoords({ lat: 37.5622, lng: 126.9086 });
        fetchExternal(37.5622, 126.9086);
        return;
      }
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        fetchExternal(lat, lng);
      } catch {
        setUserCoords({ lat: 37.5622, lng: 126.9086 });
        fetchExternal(37.5622, 126.9086); /* 위치 거부 시 마포구 기본값 */
      }
    }

    initLocation();
  }, []);

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
              hasRibbon: p.certification?.includes('블루리본') || (p.ribbonCount && p.ribbonCount > 0),
              hasCheonha: p.certification?.includes('천하제빵'),
              hasMyungjang: p.certification?.includes('제과명장'),
              image: p.thumbnailImage || null,
              googlePlaceId: p.GOOGLE_PLACE_ID || null,
              menuTags: tags,
              lat: parseFloat(p.LATITUDE),
              lng: parseFloat(p.LONGITUDE),
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

  /* --- DB 빵집 + 외부 빵집 합치기 (이름 중복 제거) --- */
  const dbNames = new Set(bakeries.map(b => b.name));
  const mergedBakeries = [
    ...bakeries,
    ...externalBakeries
      .filter(ext => !dbNames.has(ext.name))
      .map(ext => {
        const regionMatch = ext.address?.match(/([가-힣]+구)/);
        return {
          id: `ext_${ext.placeId}`,
          name: ext.name,
          address: ext.address,
          region: regionMatch ? regionMatch[1] : '',
          rating: ext.rating ? Number(ext.rating).toFixed(1) : '0.0',
          reviewCount: 0,
          hasRibbon: false,
          image: ext.photoUrl || null,
          menuTags: [],
          isExternal: true,
          lat: ext.lat,
          lng: ext.lng,
        };
      }),
  ];

  /* --- 필터링 + 정렬 --- */
  const filteredBakeries = mergedBakeries
    /* 1) 검색어 필터 */
    .filter(b => {
      if (!searchKeyword) return true;
      const keyword = searchKeyword.toLowerCase();
      return b.name.toLowerCase().includes(keyword) ||
             b.address.toLowerCase().includes(keyword) ||
             b.menuTags.some(t => t.toLowerCase().includes(keyword));
    })
    /* 2) 메뉴 태그 필터 (외부 빵집은 태그 없으므로 태그 선택 시 숨김) */
    .filter(b => {
      if (!activeMenuTag) return true;
      if (b.isExternal) return false;
      return b.menuTags.some(t => t === activeMenuTag);
    })
    /* 3) 정렬 */
    .sort((a, b) => {
      /* 거리순: 사용자 위치 기준 가까운 순 (위도/경도 없으면 맨 뒤) */
      if (activeSort === '거리순') {
        if (!userCoords) return 0;
        const hasA = a.lat != null && a.lng != null;
        const hasB = b.lat != null && b.lng != null;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        const dA = calcDistance(userCoords.lat, userCoords.lng, a.lat, a.lng);
        const dB = calcDistance(userCoords.lat, userCoords.lng, b.lat, b.lng);
        return dA - dB;
      }
      if (activeSort === '별점순') return parseFloat(b.rating) - parseFloat(a.rating);
      /* 인기순/최신순: DB 빵집 우선, 외부는 뒤로 */
      if (a.isExternal && !b.isExternal) return 1;
      if (!a.isExternal && b.isExternal) return -1;
      if (activeSort === '인기순') return b.reviewCount - a.reviewCount;
      return (typeof b.id === 'number' ? b.id : 0) - (typeof a.id === 'number' ? a.id : 0);
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
            {externalBakeries.length > 0 && (
              <span className="pl-result-external"> (주변 {externalBakeries.length}개 포함)</span>
            )}
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

        {/* ===== 주변 베이커리 로딩 중 안내 ===== */}
        {!loading && externalLoading && (
          <div className="pl-external-loading">
            <span className="pl-external-loading-dot" />
            주변 베이커리 검색 중...
          </div>
        )}

        {/* ===== 빵집 카드 그리드 ===== */}
        {!loading && (
          <div className="pl-grid">
            {filteredBakeries.slice(0, visibleCount).map((bakery) => (
              <div
                key={bakery.id}
                className={`pl-card ${bakery.isExternal ? 'pl-card-external' : ''}`}
                onClick={() => navigate(`/place/${bakery.id}`)}
              >
                {/* 카드 이미지 */}
                <div className="pl-card-img">
                  <PlaceCardImage
                    image={bakery.image}
                    googlePlaceId={bakery.googlePlaceId}
                    placeId={bakery.id}
                    name={bakery.name}
                  />

                  {bakery.hasRibbon && (
                    <span className="pl-card-ribbon">🎀 블루리본</span>
                  )}
                  {bakery.hasCheonha && (
                    <span className="pl-card-ribbon" style={{ background: 'rgba(220,252,231,0.92)', color: '#166534' }}>🏆 천하제빵</span>
                  )}
                  {bakery.hasMyungjang && (
                    <span className="pl-card-ribbon" style={{ background: 'rgba(254,243,199,0.92)', color: '#92400e' }}>🥇 제과제빵명장</span>
                  )}
                  {bakery.isExternal && (
                    <span className="pl-card-external-badge">지도 검색</span>
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
