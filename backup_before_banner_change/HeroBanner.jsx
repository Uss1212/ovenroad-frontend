/* ===================================================
   HeroBanner 컴포넌트 (히어로 배너)
   - 메인 페이지 맨 위, 헤더 바로 아래에 보이는 큰 영역
   - 배경: 네이버 지도 API (실제 지도!)
   - 내 위치(또는 기본 위치) 기준으로 추천 빵집 5개 마커 표시
   - 각 빵집에 블루리본/천하제빵/제빵명장 뱃지가 있는지 표시
   - 마커를 클릭하면 왼쪽에 빵집 상세 카드가 뜸
   - 지도 위에 검색바 + 뱃지 필터 버튼도 있음
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroBanner.css';

export default function HeroBanner() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 사용하는 함수 */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */

  /* searchKeyword: 검색창에 입력한 검색어를 기억하는 변수 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /* activeBadge: 현재 선택한 인증 뱃지 (null이면 아무것도 안 선택된 상태) */
  const [activeBadge, setActiveBadge] = useState(null);

  /* selectedBakery: 지도에서 마커를 클릭했을 때 선택된 빵집 데이터 */
  /* null이면 아무 빵집도 선택 안 된 상태 → 카드가 안 보임 */
  const [selectedBakery, setSelectedBakery] = useState(null);

  /* isLiked: 좋아요 버튼을 눌렀는지 안 눌렀는지 기억 */
  const [isLiked, setIsLiked] = useState(false);

  /* isScraped: 스크랩(저장) 버튼을 눌렀는지 기억 */
  const [isScraped, setIsScraped] = useState(false);

  /* userLocation: 사용자의 현재 위치 (위도, 경도) */
  /* 기본값은 서울 연남동 근처 (위치를 못 가져올 때 사용) */
  const [userLocation, setUserLocation] = useState({
    lat: 37.5565,
    lng: 126.9225,
  });

  /* ── 인증 뱃지 목록 ── */
  /* 전체: 모든 빵집을 다 보여주는 버튼 (주황색) */
  /* 블루리본: 블루리본 서베이에서 선정한 맛집 (파란색) */
  /* 천하제빵: 천하제빵 인증을 받은 빵집 (초록색) */
  const badges = [
    { id: 'all',        name: '전체',       color: '#c96442', icon: '🍞' },
    { id: 'blueribbon', name: '블루리본',   color: '#1a73e8', icon: '🎀' },
    { id: 'cheonha',    name: '천하제빵',   color: '#16a34a', icon: '🏆' },
  ];

  /* ── DB에서 불러온 빵집 데이터를 저장하는 상태 ── */
  /* 처음에는 빈 배열 → API 호출 후 채워짐 */
  const [recommendedBakeries, setRecommendedBakeries] = useState([]);

  /* ── 백엔드 API에서 빵집 데이터 가져오기 ── */
  /* 컴포넌트가 처음 화면에 나타날 때 한 번 실행 */
  useEffect(() => {
    async function fetchPlaces() {
      try {
        /* 백엔드 API 호출: 모든 빵집 목록 가져오기 */
        const res = await fetch('http://localhost:8080/api/places');
        const data = await res.json();

        /* API 응답 데이터를 프론트엔드 형식으로 변환 */
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE)  /* 좌표 없는 건 제외 */
          .map(p => {
            /* 뱃지 결정: 블루리본 개수가 있으면 블루리본 뱃지 추가 */
            const badgeList = [];
            if (p.ribbonCount && p.ribbonCount > 0) badgeList.push('blueribbon');

            return {
              id: p.PLACE_NUM,                         /* 빵집 고유 번호 */
              name: p.PLACE_NAME,                      /* 빵집 이름 */
              address: p.ADDRESS || '',                 /* 주소 */
              rating: p.avgRating ? Number(p.avgRating).toFixed(1) : 0, /* 평균 별점 */
              reviewCount: p.reviewCount || 0,         /* 리뷰 수 */
              signature: '',                           /* 대표메뉴 (추후 추가) */
              badges: badgeList,                       /* 인증 뱃지 */
              thumbnail: p.thumbnailImage || null,     /* 대표 이미지 URL */
              lat: parseFloat(p.LATITUDE),             /* 위도 */
              lng: parseFloat(p.LONGITUDE),            /* 경도 */
            };
          });

        /* 변환한 데이터를 상태에 저장 → 지도에 마커로 표시됨 */
        setRecommendedBakeries(mapped);
      } catch (err) {
        console.error('빵집 데이터 불러오기 실패:', err);
      }
    }
    fetchPlaces();
  }, []);

  /* ── 검색 실행 함수 ── */
  /* 검색어를 가지고 빵지도 페이지(/map)로 이동하는 함수 */
  const handleSearch = () => {
    /* URL 뒤에 붙일 검색 조건(쿼리 파라미터) 만들기 */
    const params = new URLSearchParams();
    /* 검색어가 있으면 search 파라미터 추가 */
    if (searchKeyword) params.set('search', searchKeyword);
    /* 선택한 뱃지가 있으면 badge 파라미터 추가 */
    if (activeBadge) params.set('badge', activeBadge);
    /* /map?search=빵집이름&badge=blueribbon 이런 식으로 이동 */
    navigate(`/map?${params.toString()}`);
  };

  /* ── 엔터키로 검색 실행 ── */
  /* 검색창에서 엔터키를 누르면 검색이 실행되도록 */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  /* --- 지도를 넣을 div를 가리키는 참조(ref) --- */
  /* useRef: 특정 HTML 요소를 직접 가리킬 때 사용 */
  const mapRef = useRef(null);

  /* mapInstanceRef: 생성된 네이버 지도 객체를 저장 */
  /* 나중에 지도를 움직이거나 마커를 추가할 때 이 객체를 사용 */
  const mapInstanceRef = useRef(null);

  /* markersRef: 지도 위에 찍힌 마커들을 저장하는 배열 */
  const markersRef = useRef([]);

  /* ── 사용자 위치 가져오기 ── */
  /* 컴포넌트가 처음 화면에 나타날 때 브라우저에게 "내 위치 알려줘" 요청 */
  useEffect(() => {
    /* navigator.geolocation: 브라우저가 제공하는 위치 정보 API */
    /* 사용자가 "위치 허용"을 누르면 현재 GPS 좌표를 받아옴 */
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        /* 성공: 위치를 받아오면 실행되는 함수 */
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,   /* 위도 (세로 위치) */
            lng: position.coords.longitude,  /* 경도 (가로 위치) */
          });
        },
        /* 실패: 위치를 못 가져오면 (거부하거나 에러) → 기본 위치 사용 */
        () => {
          /* 아무것도 안 함 → 기본값(연남동)이 그대로 사용됨 */
          console.log('위치 정보를 가져올 수 없어서 기본 위치(연남동)를 사용합니다.');
        }
      );
    }
  }, []); /* [] → 처음 한 번만 실행 */

  /* ── 네이버 지도 초기화 + 마커 표시 ── */
  /* userLocation이 바뀔 때마다 (= 위치를 받아올 때) 지도를 새로 그림 */
  useEffect(() => {
    /* naver 지도 라이브러리가 아직 로딩 안 됐으면 실행하지 않음 */
    if (!window.naver || !window.naver.maps) return;

    /* --- 지도 생성 --- */
    /* mapRef가 가리키는 div 안에 네이버 지도를 그림 */
    const map = new window.naver.maps.Map(mapRef.current, {
      /* 지도의 중심 좌표 = 사용자의 현재 위치 (또는 기본: 서울 중심) */
      center: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
      /* 확대 레벨: 12 → 서울 전체가 보이는 정도 (DB 빵집이 많으니까) */
      zoom: 12,
      /* 줌 컨트롤(확대/축소 버튼) 숨기기 → 깔끔한 배너 느낌 */
      zoomControl: false,
      /* 지도 타입 컨트롤(일반/위성 전환) 숨기기 */
      mapTypeControl: false,
    });

    /* 만든 지도 객체를 ref에 저장 → 나중에 다른 곳에서 쓸 수 있게 */
    mapInstanceRef.current = map;

    /* --- 내 위치 마커 표시 --- */
    /* 파란색 점으로 "여기가 내 위치야!" 표시 */
    new window.naver.maps.Marker({
      map: map,
      position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
      icon: {
        /* HTML로 파란 동그라미 만들기 */
        content: `
          <div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4285f4;
            border: 3px solid #ffffff;
            box-shadow: 0 0 8px rgba(66,133,244,0.5);
          "></div>
        `,
        anchor: new window.naver.maps.Point(8, 8),
      },
      /* 이 마커는 클릭해도 아무 반응 없게 */
      clickable: false,
    });

    /* --- 빵집 마커 표시 --- */
    /* DB에서 가져온 빵집 데이터를 하나씩 돌면서 지도에 마커를 찍음 */
    const newMarkers = recommendedBakeries.map((bakery) => {

      /* 블루리본 빵집인지 확인 */
      const isBlueRibbon = bakery.badges && bakery.badges.includes('blueribbon');

      /* 마커 생성: 블루리본이면 리본 아이콘, 아니면 빵 아이콘 */
      const marker = new window.naver.maps.Marker({
        map: map,
        position: new window.naver.maps.LatLng(bakery.lat, bakery.lng),
        icon: {
          content: `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 20px;
              background: #ffffff;
              border: 2.5px solid ${isBlueRibbon ? '#1a73e8' : '#c96442'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.18);
              cursor: pointer;
              transition: transform 0.2s;
            ">${isBlueRibbon ? '🎀' : '🍞'}</div>
          `,
          /* 마커의 기준점 (가운데) → 좌표가 마커 정중앙에 오도록 */
          anchor: new window.naver.maps.Point(20, 20),
        },
      });

      /* 마커에 빵집 데이터를 저장 → 나중에 필터링할 때 사용 */
      marker._bakeryData = bakery;

      /* --- 마커 클릭 이벤트 --- */
      /* 마커를 클릭하면 → 해당 빵집을 선택 → 왼쪽에 카드가 나타남 */
      window.naver.maps.Event.addListener(marker, 'click', () => {
        /* 선택된 빵집 데이터를 상태에 저장 → 카드가 표시됨 */
        setSelectedBakery(bakery);
        /* 좋아요/스크랩 초기화 (빵집이 바뀌었으니까) */
        setIsLiked(false);
        setIsScraped(false);
        /* 지도 중심을 클릭한 빵집으로 부드럽게 이동 */
        map.panTo(new window.naver.maps.LatLng(bakery.lat, bakery.lng));
      });

      return marker;
    });

    /* 만든 마커들을 ref에 저장 */
    markersRef.current = newMarkers;

    /* --- 지도 빈 곳 클릭 시 카드 닫기 --- */
    /* 지도의 빈 공간을 클릭하면 선택된 빵집 카드를 숨김 */
    window.naver.maps.Event.addListener(map, 'click', () => {
      setSelectedBakery(null);
    });

    /* ── 정리 함수 (cleanup) ── */
    /* 컴포넌트가 사라지거나 다시 그려질 때 기존 마커 제거 */
    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, [userLocation, recommendedBakeries]); /* 위치가 바뀌거나 빵집 데이터가 로드되면 지도를 다시 그림 */

  /* ── 뱃지 필터가 바뀔 때 마커 보이기/숨기기 ── */
  /* activeBadge가 바뀔 때마다 실행 */
  /* 선택한 뱃지가 없으면(null) → 모든 마커 표시 */
  /* 선택한 뱃지가 있으면 → 해당 뱃지가 있는 빵집 마커만 표시, 나머지는 숨김 */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;  /* 지도가 아직 없으면 실행 안 함 */

    markersRef.current.forEach((marker) => {
      /* 마커에 저장해둔 빵집 데이터 가져오기 */
      const bakery = marker._bakeryData;
      if (!bakery) return;

      if (activeBadge === null || activeBadge === 'all') {
        /* 뱃지 필터 안 선택 또는 '전체' 선택 → 모든 마커 보이기 */
        marker.setMap(map);
      } else {
        /* 선택된 뱃지가 이 빵집에 있는지 확인 */
        if (bakery.badges.includes(activeBadge)) {
          /* 해당 뱃지가 있으면 → 마커 표시 */
          marker.setMap(map);
        } else {
          /* 해당 뱃지가 없으면 → 마커 숨기기 */
          marker.setMap(null);
        }
      }
    });
  }, [activeBadge]); /* activeBadge가 바뀔 때마다 실행 */

  return (
    /* 히어로 배너 전체를 감싸는 영역 */
    <div className="hero-banner">

      {/* ===== 배경: 네이버 지도 영역 ===== */}
      {/* ref={mapRef} → 이 div를 mapRef로 가리켜서 네이버 지도가 여기에 그려짐 */}
      <div className="hero-map-bg" ref={mapRef} />

      {/* ===== 지도 위 검색바 + 인증 뱃지 버튼 ===== */}
      {/* position: absolute로 지도 위에 떠있는 형태 */}
      <div className="hero-search-bar">

        {/* 검색 입력창 */}
        <div className="hero-search-wrap">
          {/* 돋보기 아이콘 */}
          <span className="hero-search-icon">🔍</span>
          {/* 검색어 입력 필드 */}
          <input
            type="text"
            className="hero-search-input"
            placeholder="빵집 이름이나 지역을 검색해보세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {/* 검색 버튼 (클릭하면 빵지도 페이지로 이동) */}
          <button className="hero-search-btn" onClick={handleSearch}>
            검색
          </button>
        </div>

        {/* 인증 뱃지 필터 버튼들 (블루리본, 천하제빵, 제빵명장) */}
        <div className="hero-badge-filters">
          {badges.map((badge) => (
            <button
              key={badge.id}
              /* 선택된 뱃지면 'active' 클래스 추가 → 배경색이 바뀜 */
              className={`hero-badge-btn ${activeBadge === badge.id ? 'active' : ''}`}
              onClick={() => {
                /* 같은 뱃지를 다시 클릭하면 선택 해제, 아니면 선택 */
                setActiveBadge(activeBadge === badge.id ? null : badge.id);
              }}
              /* 뱃지마다 고유 색상을 CSS 변수로 전달 (CSS에서 이 색상 사용) */
              style={{ '--badge-color': badge.color }}
            >
              <span className="hero-badge-icon">{badge.icon}</span>
              <span className="hero-badge-name">{badge.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 왼쪽: 빵집 상세 카드 ===== */}
      {/* selectedBakery가 있을 때만 카드를 보여줌 (마커를 클릭해야 나타남) */}
      {selectedBakery && (
        <div className="hero-place-card">

          {/* --- 카드 상단: 빵집 이미지 --- */}
          <div className="place-card-images">
            {selectedBakery.thumbnail ? (
              <img
                src={selectedBakery.thumbnail.startsWith('http')
                  ? selectedBakery.thumbnail
                  : `http://localhost:8080${selectedBakery.thumbnail}`}
                alt={selectedBakery.name}
                className="place-card-real-img"
              />
            ) : (
              <div className="place-card-img main-img">
                <div className="img-placeholder">🍞 사진 준비중</div>
              </div>
            )}
          </div>

          {/* --- 빵집 이름과 위치 정보 --- */}
          <div className="place-card-info">
            {/* 빵집 이름 (클릭하면 빵집 상세 페이지로 이동) */}
            <h2
              className="place-name"
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d6d3d1', textUnderlineOffset: '4px' }}
              onClick={() => navigate(`/place/${selectedBakery.id}`)}
            >
              {selectedBakery.name}
            </h2>
            {/* 빵집 주소 */}
            <p className="place-address">{selectedBakery.address}</p>

            {/* --- 인증 뱃지 표시 --- */}
            {/* 이 빵집이 가지고 있는 뱃지들을 보여줌 */}
            {selectedBakery.badges.length > 0 && (
              <div className="place-badges">
                {selectedBakery.badges.map((badgeId) => {
                  /* badges 배열에서 해당 뱃지의 상세 정보(이름, 색상, 아이콘) 찾기 */
                  const badgeInfo = badges.find((b) => b.id === badgeId);
                  if (!badgeInfo) return null;
                  return (
                    <span
                      key={badgeId}
                      className="place-badge-chip"
                      /* 뱃지 고유 색상을 CSS 변수로 전달 */
                      style={{ '--badge-color': badgeInfo.color }}
                    >
                      {badgeInfo.icon} {badgeInfo.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- 별점 + 대표 메뉴 --- */}
          <div className="place-card-meta">
            {/* 별점 (리뷰가 있을 때만 표시) */}
            {selectedBakery.rating > 0 && (
              <div className="place-rating">
                <span className="place-stars">⭐</span>
                <span className="place-rating-num">{selectedBakery.rating}</span>
                <span className="place-review-count">({selectedBakery.reviewCount})</span>
              </div>
            )}
            {/* 대표 메뉴 (있을 때만 표시) */}
            {selectedBakery.signature && (
              <p className="place-signature">🍰 {selectedBakery.signature}</p>
            )}
          </div>

          {/* --- 액션 버튼 모음 (좋아요, 스크랩, 공유 등) --- */}
          <div className="place-card-actions">
            {/* 좋아요 버튼: 누르면 빨간 하트로 바뀜 */}
            <button
              className={`action-btn ${isLiked ? 'active' : ''}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              {isLiked ? '❤️' : '🤍'}
              <span>좋아요</span>
            </button>

            {/* 스크랩(저장) 버튼: 누르면 노란 별로 바뀜 */}
            <button
              className={`action-btn ${isScraped ? 'active' : ''}`}
              onClick={() => setIsScraped(!isScraped)}
            >
              {isScraped ? '⭐' : '☆'}
              <span>스크랩</span>
            </button>

            {/* 공유 버튼 */}
            <button className="action-btn">
              ↗️
              <span>공유</span>
            </button>

            {/* 길찾기 버튼: 클릭하면 네이버 지도 길찾기 페이지가 새 탭에서 열림 */}
            <button
              className="action-btn"
              onClick={() => {
                /* 네이버 지도 검색 URL로 이동 → 해당 빵집이 검색된 상태로 열림 */
                /* 거기서 "길찾기" 버튼을 누르면 바로 경로 안내 가능 */
                window.open(
                  `https://map.naver.com/v5/search/${encodeURIComponent(selectedBakery.name + ' ' + selectedBakery.address)}`,
                  '_blank'
                );
              }}
            >
              🧭
              <span>길찾기</span>
            </button>
          </div>

        </div>
      )}

      {/* ===== 마커를 아직 클릭 안 했을 때 안내 문구 ===== */}
      {/* 카드가 안 보일 때 사용자에게 마커를 클릭하라고 알려줌 */}
      {!selectedBakery && (
        <div className="hero-guide-msg">
          <span className="hero-guide-icon">👆</span>
          <p className="hero-guide-text">마커를 클릭하면 빵집 정보를 볼 수 있어요</p>
        </div>
      )}
    </div>
  );
}
