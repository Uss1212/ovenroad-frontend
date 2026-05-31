/* global MarkerClustering */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './HeroBanner.css';

export default function HeroBanner() {
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeBadge, setActiveBadge] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 37.5565, lng: 126.9225 });
  const [recommendedBakeries, setRecommendedBakeries] = useState([]);
  const [externalBakeries, setExternalBakeries] = useState([]);
  const [externalLoading, setExternalLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBakery, setSelectedBakery] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedGoogleInfo, setSelectedGoogleInfo] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const clusterRef = useRef(null);
  const myLocationMarkerRef = useRef(null);
  const searchWrapRef = useRef(null);

  const badges = [
    { id: 'blueribbon', name: '블루리본',    color: '#1a73e8', img: '/badge-blueribbon.png' },
    { id: 'cheonha',    name: '천하제빵',    color: '#16a34a', img: '/badge-cheonha.png' },
    { id: 'myungjang',  name: '제과제빵명장', color: '#f59e0b', img: '/badge-myungjang.png' },
  ];

  /* 지금 뜨는 빵집: 평점 높은 순 상위 5개 */
  const topBakeries = [...recommendedBakeries]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  /* 검색 자동완성 */
  const searchSuggestions = searchKeyword.length >= 1
    ? [
        ...recommendedBakeries,
        ...externalBakeries
          .filter(ext => !new Set(recommendedBakeries.map(b => b.name)).has(ext.name))
          .map(ext => ({
            id: `ext_${ext.placeId}`,
            name: ext.name,
            address: ext.address,
            rating: ext.rating,
            menuTags: [],
            thumbnail: null,
            lat: ext.lat,
            lng: ext.lng,
            isExternal: true,
          })),
      ]
        .filter(b => {
          const kw = searchKeyword.toLowerCase();
          return b.name.toLowerCase().includes(kw) ||
                 b.address.toLowerCase().includes(kw) ||
                 (b.menuTags || []).some(t => t.toLowerCase().includes(kw));
        })
        .slice(0, 5)
    : [];

  /* DB 빵집 목록 불러오기 */
  useEffect(() => {
    async function fetchPlaces() {
      try {
        const res = await fetch(`${BASE_URL}/api/places`);
        const data = await res.json();
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .map(p => {
            const badgeList = [];
            if (p.certification?.includes('블루리본') || (p.ribbonCount && p.ribbonCount > 0)) badgeList.push('blueribbon');
            if (p.certification?.includes('천하제빵')) badgeList.push('cheonha');
            if (p.certification?.includes('제과명장')) badgeList.push('myungjang');
            return {
              id: p.PLACE_NUM,
              name: p.PLACE_NAME,
              address: p.ADDRESS || '',
              rating: p.avgRating ? Number(p.avgRating).toFixed(1) : 0,
              reviewCount: p.reviewCount || 0,
              menuTags: p.menuTags ? p.menuTags.split(',').slice(0, 3) : [],
              badges: badgeList,
              thumbnail: p.thumbnailImage || null,
              lat: parseFloat(p.LATITUDE),
              lng: parseFloat(p.LONGITUDE),
            };
          });
        setRecommendedBakeries(mapped);
      } catch (err) {
        console.error('빵집 데이터 불러오기 실패:', err);
      }
    }
    fetchPlaces();
  }, []);

  /* 마커 클릭 시 DB 빵집 이미지 + 영업시간 fetch */
  useEffect(() => {
    if (!selectedBakery || selectedBakery.isExternal) {
      setSelectedImages([]);
      setSelectedGoogleInfo(null);
      return;
    }
    fetch(`${BASE_URL}/api/places/${selectedBakery.id}`)
      .then(r => r.json())
      .then(data => setSelectedImages(data.images || []))
      .catch(() => setSelectedImages([]));
    fetch(`${BASE_URL}/api/places/${selectedBakery.id}/google-details`)
      .then(r => r.json())
      .then(data => { if (data?.found) setSelectedGoogleInfo(data); else setSelectedGoogleInfo(null); })
      .catch(() => setSelectedGoogleInfo(null));
  }, [selectedBakery]);

  /* 검색창 바깥 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* 위치 + 주변 베이커리 */
  useEffect(() => {
    async function fetchExternalBakeries(lat, lng) {
      try {
        setExternalLoading(true);
        const res = await fetch(`${BASE_URL}/api/places/nearby-bakeries?lat=${lat}&lng=${lng}&radius=5000`);
        const data = await res.json();
        setExternalBakeries(Array.isArray(data) ? data : []);
      } catch {
        // DB 빵집은 계속 표시
      } finally {
        setExternalLoading(false);
      }
    }

    async function initLocation() {
      if (!navigator.geolocation) {
        fetchExternalBakeries(37.5622, 126.9086);
        return;
      }
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        fetchExternalBakeries(lat, lng);
      } catch {
        fetchExternalBakeries(37.5622, 126.9086);
      }
    }
    initLocation();
  }, []);

  /* 지도 초기화 (최초 1회) */
  useEffect(() => {
    if (!window.naver || !window.naver.maps) return;
    if (!mapInstanceRef.current) {
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
        zoom: 14,
        zoomControl: false,
        mapTypeControl: false,
      });
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.panTo(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
    }
  }, [userLocation]);

  /* 내 위치 마커 */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;
    if (myLocationMarkerRef.current) myLocationMarkerRef.current.setMap(null);
    myLocationMarkerRef.current = new window.naver.maps.Marker({
      map,
      position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
      icon: {
        content: `<div style="width:16px;height:16px;border-radius:50%;background:#4285f4;border:3px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.5);"></div>`,
        anchor: new window.naver.maps.Point(8, 8),
      },
      clickable: false,
    });
  }, [userLocation]);

  /* 빵집 마커 + 클러스터 업데이트 */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;

    markersRef.current.forEach(m => m.setMap(null));
    if (clusterRef.current) { clusterRef.current.setMap(null); clusterRef.current = null; }

    const dbNames = new Set(recommendedBakeries.map(b => b.name));
    const allBakeries = [
      ...recommendedBakeries,
      ...externalBakeries
        .filter(ext => !dbNames.has(ext.name))
        .map(ext => ({
          id: `ext_${ext.placeId}`,
          name: ext.name,
          address: ext.address,
          rating: ext.rating,
          reviewCount: 0,
          menuTags: [],
          badges: [],
          thumbnail: ext.photoUrl || null,
          lat: ext.lat,
          lng: ext.lng,
          isExternal: true,
        })),
    ];

    const newMarkers = allBakeries.map(bakery => {
      const isBlueRibbon = bakery.badges?.includes('blueribbon');
      const isExternal = bakery.isExternal;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(bakery.lat, bakery.lng),
        icon: {
          content: `<div style="width:40px;height:40px;border-radius:20px;background:#fff;border:2.5px solid ${isBlueRibbon ? '#1a73e8' : isExternal ? '#aaa' : '#c96442'};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.18);cursor:pointer;opacity:${isExternal ? '0.75' : '1'};">${isBlueRibbon ? '🎀' : '🍞'}</div>`,
          anchor: new window.naver.maps.Point(20, 20),
        },
      });
      marker._bakeryData = bakery;
      window.naver.maps.Event.addListener(marker, 'click', () => {
        map.panTo(new window.naver.maps.LatLng(bakery.lat, bakery.lng));
        setSelectedBakery(bakery);
      });
      return marker;
    });

    markersRef.current = newMarkers;

    if (typeof MarkerClustering !== 'undefined' && newMarkers.length > 0) {
      const mkIcon = (size, bg) => ({
        content: `<div style="cursor:pointer;width:${size}px;height:${size}px;line-height:${size}px;font-size:13px;color:white;text-align:center;font-weight:bold;background:${bg};border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size / 2, size / 2),
      });
      clusterRef.current = new MarkerClustering({
        minClusterSize: 2, maxZoom: 15, map, markers: newMarkers,
        disableClickZoom: false, gridSize: 120,
        icons: [mkIcon(40, '#c96442'), mkIcon(50, '#92400e'), mkIcon(60, '#78350f')],
        indexGenerator: [2, 10, 30],
        stylingFunction: (cm, count) => {
          const el = cm.getElement();
          if (el) { const d = el.querySelector('div'); if (d) d.textContent = count; }
        },
      });
    }

    return () => {
      newMarkers.forEach(m => m.setMap(null));
      if (clusterRef.current) { clusterRef.current.setMap(null); clusterRef.current = null; }
    };
  }, [recommendedBakeries, externalBakeries]);

  /* 뱃지 필터 */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const filtered = markersRef.current.filter(marker => {
      const b = marker._bakeryData;
      if (!b) return false;
      if (activeBadge === null) return true;
      return b.badges?.includes(activeBadge);
    });

    if (clusterRef.current) clusterRef.current.setMap(null);
    markersRef.current.forEach(m => m.setMap(null));

    if (typeof MarkerClustering !== 'undefined' && filtered.length > 0) {
      const mkIcon = (size, bg) => ({
        content: `<div style="cursor:pointer;width:${size}px;height:${size}px;line-height:${size}px;font-size:13px;color:white;text-align:center;font-weight:bold;background:${bg};border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size / 2, size / 2),
      });
      clusterRef.current = new MarkerClustering({
        minClusterSize: 2, maxZoom: 15, map, markers: filtered,
        disableClickZoom: false, gridSize: 120,
        icons: [mkIcon(40, '#c96442'), mkIcon(50, '#92400e'), mkIcon(60, '#78350f')],
        indexGenerator: [2, 10, 30],
        stylingFunction: (cm, count) => {
          const el = cm.getElement();
          if (el) { const d = el.querySelector('div'); if (d) d.textContent = count; }
        },
      });
    }
  }, [activeBadge]);

  const handleSearch = () => {
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchKeyword) params.set('search', searchKeyword);
    if (activeBadge && activeBadge !== 'all') params.set('badge', activeBadge);
    navigate(`/places?${params.toString()}`);
  };

  /* 선택된 장소의 대표 이미지 URL */
  const getThumbUrl = (bakery) => {
    if (!bakery || !bakery.thumbnail) return null;
    return bakery.thumbnail.startsWith('http') ? bakery.thumbnail : `${BASE_URL}${bakery.thumbnail}`;
  };

  /* 선택된 장소 패널 이미지 목록 (최대 4장) */
  const displayImages = selectedImages.length > 0
    ? selectedImages.slice(0, 4).map(img => img.IMAGE_URL?.startsWith('http') ? img.IMAGE_URL : `${BASE_URL}${img.IMAGE_URL}`)
    : (getThumbUrl(selectedBakery) ? [getThumbUrl(selectedBakery)] : []);

  const badgeLabels = {
    blueribbon: { icon: '🎀', label: '블루리본', cls: 'ribbon' },
    cheonha:    { icon: '🏆', label: '천하제빵', cls: 'cheonha' },
    myungjang:  { icon: '🥇', label: '제과제빵명장', cls: 'myungjang' },
  };

  return (
    <section className="hero-section">

      {/* 지도 — 전체 배경 */}
      <div className="hero-map-bg" ref={mapRef} />

      {/* ===== 왼쪽 플로팅 패널 ===== */}
      <div className="hero-left">

        {selectedBakery ? (
          /* ── 장소 상세 패널 ── */
          <div className="hero-place-panel">
            <button className="hero-place-back-btn" onClick={() => setSelectedBakery(null)}>
              ← 검색으로 돌아가기
            </button>

            {/* 이미지 영역 */}
            {displayImages.length > 0 ? (
              <div className={`hero-place-imgs hero-place-imgs-${Math.min(displayImages.length, 4)}`}>
                {displayImages.map((url, i) => (
                  <div key={i} className="hero-place-img-wrap">
                    <img src={url} alt="" className="hero-place-img" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="hero-place-img-placeholder">🍞</div>
            )}

            {/* 정보 */}
            <div className="hero-place-info">
              <h3 className="hero-place-name">{selectedBakery.name}</h3>

              {/* 뱃지 */}
              {selectedBakery.badges?.length > 0 && (
                <div className="hero-place-badges">
                  {selectedBakery.badges.map(b => {
                    const info = badgeLabels[b];
                    return info ? (
                      <span key={b} className={`hero-place-badge ${info.cls}`}>
                        {info.icon} {info.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <p className="hero-place-address">📍 {selectedBakery.address || '주소 정보 없음'}</p>

              {Number(selectedBakery.rating) > 0 && (
                <p className="hero-place-rating">
                  ⭐ {selectedBakery.rating}
                  {selectedBakery.reviewCount > 0 && (
                    <span className="hero-place-review-count"> ({selectedBakery.reviewCount}개 리뷰)</span>
                  )}
                </p>
              )}

              {selectedGoogleInfo && (
                <div className="hero-place-hours">
                  <div className="hero-place-open-status">
                    {selectedGoogleInfo.isOpenNow === true && <span className="hero-open-badge">영업중</span>}
                    {selectedGoogleInfo.isOpenNow === false && <span className="hero-closed-badge">영업종료</span>}
                    <span className="hero-place-hours-label">영업시간</span>
                  </div>
                  {selectedGoogleInfo.openingHours && (
                    <ul className="hero-place-hours-list">
                      {selectedGoogleInfo.openingHours.map((line, i) => (
                        <li key={i} className="hero-place-hours-item">{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedBakery.menuTags?.length > 0 && (
                <div className="hero-place-tags">
                  {selectedBakery.menuTags.map(t => (
                    <span key={t} className="hero-place-tag">#{t}</span>
                  ))}
                </div>
              )}

              {!selectedBakery.isExternal && (
                <button
                  className="hero-place-detail-btn"
                  onClick={() => navigate(`/place/${selectedBakery.id}`)}
                >
                  장소 상세 보기 →
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── 검색 패널 (기본) ── */
          <>
            <div className="hero-left-header">
              <h2 className="hero-left-title">
                <i className="fi fi-sr-bread hero-title-icon"></i>
                어떤 빵집을 찾으시나요?
              </h2>
              <p className="hero-left-desc">
                빵집 이름이나 지점을 정확히 입력해주세요 (예: 어니언 성수)
              </p>
            </div>

            <div className="hero-search-area" ref={searchWrapRef}>
              <div className="hero-search-wrap">
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="지도 검색"
                  value={searchKeyword}
                  onChange={e => { setSearchKeyword(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                />
                <button className="hero-search-icon-btn" onClick={handleSearch}>
                  <i className="fi fi-rr-search"></i>
                </button>
              </div>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="hero-suggestions">
                  {searchSuggestions.map(b => (
                    <div
                      key={b.id}
                      className="hero-suggestion-item"
                      onClick={() => {
                        setShowSuggestions(false);
                        if (b.isExternal) {
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.panTo(new window.naver.maps.LatLng(b.lat, b.lng));
                            mapInstanceRef.current.setZoom(16);
                          }
                        } else {
                          navigate(`/place/${b.id}`);
                        }
                      }}
                    >
                      <div className="hero-suggestion-thumb">
                        {b.thumbnail
                          ? <img src={b.thumbnail.startsWith('http') ? b.thumbnail : `${BASE_URL}${b.thumbnail}`} alt={b.name} />
                          : <span>🍞</span>}
                      </div>
                      <div className="hero-suggestion-info">
                        <span className="hero-suggestion-name">{b.name}</span>
                        <span className="hero-suggestion-address">{b.address}</span>
                      </div>
                      {b.rating > 0 && <span className="hero-suggestion-rating">⭐ {b.rating}</span>}
                    </div>
                  ))}
                  <div className="hero-suggestion-all" onClick={() => { setShowSuggestions(false); handleSearch(); }}>
                    "{searchKeyword}" 전체 검색 결과 보기 →
                  </div>
                </div>
              )}
            </div>

            <div className="hero-trending">
              <p className="hero-trending-label">지금 뜨는 빵집</p>
              <div className="hero-trending-list">
                {topBakeries.length === 0 ? (
                  <p className="hero-trending-empty">
                    {externalLoading ? '빵집 불러오는 중...' : '등록된 빵집이 없습니다.'}
                  </p>
                ) : topBakeries.map(bakery => (
                  <div
                    key={bakery.id}
                    className="hero-trending-item"
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo(new window.naver.maps.LatLng(bakery.lat, bakery.lng));
                        mapInstanceRef.current.setZoom(16);
                      }
                      navigate(`/place/${bakery.id}`);
                    }}
                  >
                    <div className="hero-item-thumb">
                      {bakery.thumbnail
                        ? <img src={bakery.thumbnail.startsWith('http') ? bakery.thumbnail : `${BASE_URL}${bakery.thumbnail}`} alt={bakery.name} />
                        : <span className="hero-item-thumb-placeholder">🍞</span>}
                    </div>
                    <div className="hero-item-info">
                      <h4 className="hero-item-name">{bakery.name}</h4>
                      <p className="hero-item-addr">{bakery.address}</p>
                      <div className="hero-item-tags">
                        {(bakery.menuTags || []).map(tag => (
                          <span key={tag} className="hero-item-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 뱃지 필터 — 지도 위 floating */}
      <div className="hero-badge-filters">
        <button
          className={`hero-badge-btn ${activeBadge === null ? 'active' : ''}`}
          onClick={() => setActiveBadge(null)}
          style={{ '--badge-color': '#44403c' }}
        >
          <span className="hero-badge-name">전체</span>
        </button>
        {badges.map(badge => (
          <button
            key={badge.id}
            className={`hero-badge-btn ${activeBadge === badge.id ? 'active' : ''}`}
            onClick={() => setActiveBadge(activeBadge === badge.id ? null : badge.id)}
            style={{ '--badge-color': badge.color }}
          >
            <img src={badge.img} alt={badge.name} className="hero-badge-img" />
            <span className="hero-badge-name">{badge.name}</span>
          </button>
        ))}
      </div>

      {/* 줌 컨트롤 */}
      <div className="hero-zoom-controls">
        <button className="hero-zoom-btn" onClick={() => {
          const map = mapInstanceRef.current;
          if (map) map.setZoom(map.getZoom() + 1);
        }}>+</button>
        <button className="hero-zoom-btn" onClick={() => {
          const map = mapInstanceRef.current;
          if (map) map.setZoom(map.getZoom() - 1);
        }}>−</button>
      </div>

    </section>
  );
}
