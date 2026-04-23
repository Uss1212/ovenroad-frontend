/* ===================================================
   BreadMap 컴포넌트 (빵지도 페이지)
   - 지도 위에 빵집 위치를 보여주는 페이지
   - 구성:
     1) 상단 검색바 + 필터 버튼들
     2) 왼쪽: 빵집 목록 (카드 리스트, 스크롤 가능)
     3) 오른쪽: 네이버 지도 (실제 지도! 빵집 마커 표시)
     4) 빵집 카드 클릭 → 지도에서 해당 위치로 이동 + 마커 강조
   - 데스크탑: 좌우 분할 (목록 | 지도)
   - 모바일: 지도 위 + 목록 아래 (세로 분할)
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './BreadMap.css';

export default function BreadMap() {

  /* ── 페이지 이동 도구 ── */
  const navigate = useNavigate();

  /* ── 상태(state) 관리 ── */

  /* 검색어: 사용자가 입력한 빵집 이름 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /* 선택한 지역 필터 (전체, 마포구, 종로구 등) */
  const [activeRegion, setActiveRegion] = useState('전체');


  /* 선택한 인증 뱃지 필터 (블루리본, 명장, 미슐랭) */
  /* 여러 개를 동시에 선택할 수 있도록 배열로 관리 */
  const [activeBadges, setActiveBadges] = useState([]);

  /* 현재 선택(클릭)한 빵집 ID → 지도에서 강조 표시용 */
  const [selectedShop, setSelectedShop] = useState(null);

  /* 상세 패널에 보여줄 빵집 정보 (null이면 목록 표시, 값이 있으면 상세 표시) */
  const [detailShop, setDetailShop] = useState(null);

  /* 선택한 빵집의 리뷰 목록 */
  const [detailReviews, setDetailReviews] = useState([]);

  /* ── 지도 관련 참조(ref) ── */
  /* mapRef: 네이버 지도를 그릴 div를 가리키는 참조 */
  const mapRef = useRef(null);
  /* mapInstanceRef: 생성된 네이버 지도 객체를 저장 (다른 곳에서 지도 조작할 때 사용) */
  const mapInstanceRef = useRef(null);
  /* markersRef: 지도 위에 찍힌 마커 객체들을 저장하는 배열 */
  const markersRef = useRef([]);
  /* infoWindowRef: 현재 열려있는 정보창(말풍선)을 저장 */
  const infoWindowRef = useRef(null);

  /* ── DB에서 불러온 빵집 데이터를 저장하는 상태 ── */
  /* 처음에는 빈 배열 → API 호출 후 채워짐 */
  const [bakeries, setBakeries] = useState([]);

  /* ── 필터 데이터 ── */

  /* 지역 목록 (서울 주요 지역) */
  const regions = [
    '전체', '마포구', '종로구', '중구', '성동구',
    '강남구', '서초구', '용산구', '송파구',
    '강서구', '노원구', '영등포구', '서대문구',
    '동대문구', '강북구', '구로구', '강동구', '성북구',
  ];


  /* ── 인증 뱃지 목록 ── */
  /* 블루리본: 블루리본 서베이에서 선정한 맛집 (파란색) */
  /* 천하제빵: 천하제빵 인증을 받은 빵집 (초록색) */
  const badges = [
    { id: 'blueribbon', name: '블루리본',   color: '#1a73e8', icon: '🎀' },
    { id: 'cheonha',    name: '천하제빵',   color: '#16a34a', icon: '🏆' },
  ];

  /* ── 백엔드 API에서 빵집 데이터 가져오기 ── */
  /* 컴포넌트가 처음 화면에 나타날 때 한 번 실행 */
  useEffect(() => {
    async function fetchPlaces() {
      try {
        /* 백엔드 API 호출: 모든 빵집 목록 가져오기 */
        const res = await fetch(`${BASE_URL}/api/places`);
        const data = await res.json();

        /* API 응답 데이터를 프론트엔드 형식으로 변환 */
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE)  /* 좌표 없는 건 제외 */
          .map(p => {
            /* 주소에서 "구" 이름 추출 (예: "서울 마포구 ..." → "마포구") */
            const regionMatch = p.ADDRESS?.match(/([\uAC00-\uD7A3]+구)/);
            const region = regionMatch ? regionMatch[1] : '';

            /* 뱃지 결정: 블루리본 개수가 있으면 블루리본, 카테고리 상태로 천하제빵 판별 */
            const badgeList = [];
            if (p.ribbonCount && p.ribbonCount > 0) badgeList.push('blueribbon');

            return {
              id: p.PLACE_NUM,                         /* 빵집 고유 번호 */
              name: p.PLACE_NAME,                      /* 빵집 이름 */
              category: p.categoryName || '베이커리',  /* 분류 */
              region: region,                          /* 동네 (구) */
              address: p.ADDRESS,                      /* 주소 */
              rating: p.avgRating ? Number(p.avgRating).toFixed(1) : 0, /* 평균 별점 */
              reviewCount: p.reviewCount || 0,         /* 리뷰 수 */
              signature: '',                           /* 대표메뉴 (추후 추가) */
              tags: [],                                /* 태그 (추후 추가) */
              badges: badgeList,                       /* 인증 뱃지 */
              thumbnail: p.thumbnailImage || null,     /* 대표 이미지 URL */
              lat: parseFloat(p.LATITUDE),             /* 위도 */
              lng: parseFloat(p.LONGITUDE),            /* 경도 */
            };
          });

        /* 변환한 데이터를 상태에 저장 → 화면에 반영됨 */
        setBakeries(mapped);

        /* URL 해시에 #place/ID가 있으면 해당 빵집 상세 패널 자동 열기 */
        /* 예: /map#place/3 → ID가 3인 빵집의 상세 패널을 바로 보여줌 */
        const hash = window.location.hash;
        const placeMatch = hash.match(/#place\/(\d+)/);
        if (placeMatch) {
          const placeId = parseInt(placeMatch[1]);
          const found = mapped.find((b) => b.id === placeId);
          if (found) {
            setDetailShop(found);
            setSelectedShop(placeId);
          }
        }
      } catch (err) {
        console.error('빵집 데이터 불러오기 실패:', err);
      }
    }
    fetchPlaces();
  }, []);

  /* ── 빵집 상세 클릭 시 리뷰 가져오기 ── */
  useEffect(() => {
    if (!detailShop) { setDetailReviews([]); return; }
    async function fetchReviews() {
      try {
        const res = await fetch(`${BASE_URL}/api/places/${detailShop.id}`);
        const data = await res.json();
        setDetailReviews(data.reviews || []);
      } catch (err) {
        console.error('리뷰 불러오기 실패:', err);
      }
    }
    fetchReviews();
  }, [detailShop?.id]);

  /* ── 뱃지 토글 함수 ── */
  /* 뱃지 버튼을 클릭하면: 이미 선택된 뱃지면 빼고, 안 선택된 뱃지면 추가 */
  const toggleBadge = (badgeId) => {
    setActiveBadges((prev) =>
      prev.includes(badgeId)
        ? prev.filter((b) => b !== badgeId)  /* 이미 있으면 → 빼기 (선택 해제) */
        : [...prev, badgeId]                  /* 없으면 → 추가 (선택) */
    );
  };

  /* ── 필터링 로직 ── */
  /* 지역 + 카테고리 + 검색어 + 뱃지 4가지 조건으로 빵집 걸러내기 */
  const filteredBakeries = bakeries.filter((shop) => {
    /* 1) 지역 필터: "전체"이면 통과, 아니면 같은 지역만 */
    const regionMatch = activeRegion === '전체' || shop.region === activeRegion;
    /* 2) 검색어 필터: 빵집 이름이나 주소에 검색어가 포함되면 통과 */
    const searchMatch =
      searchKeyword === '' ||
      shop.name.includes(searchKeyword) ||
      shop.address.includes(searchKeyword);
    /* 4) 뱃지 필터: 선택된 뱃지가 없으면 전부 통과, 있으면 해당 뱃지를 가진 빵집만 */
    const badgeMatch =
      activeBadges.length === 0 ||
      activeBadges.some((badge) => shop.badges?.includes(badge));
    /* 세 조건 모두 만족하는 빵집만 보여줌 */
    return regionMatch && searchMatch && badgeMatch;
  });

  /* ── 별점을 ★ 문자로 변환하는 함수 ── */
  /* 예: 4.8 → "★★★★★" (소수점은 반올림해서 꽉 채운 별 개수 결정) */
  const renderStars = (rating) => {
    const full = Math.round(rating);  /* 반올림해서 별 개수 구하기 */
    return '★'.repeat(full) + '☆'.repeat(5 - full);  /* 빈 별로 나머지 채우기 */
  };

  /* ── 네이버 지도 초기화 ── */
  /* useEffect: 컴포넌트가 화면에 처음 나타날 때 한 번만 실행 */
  /* 지도를 만들고 처음 위치를 서울 중심으로 설정 */
  useEffect(() => {
    /* naver 객체가 아직 로딩 안 됐으면 실행하지 않음 */
    if (!window.naver || !window.naver.maps) return;

    /* 지도 생성: mapRef가 가리키는 div 안에 지도를 그림 */
    const map = new window.naver.maps.Map(mapRef.current, {
      /* 지도의 중심 좌표 (서울 시청 근처 → 서울 전체가 보이도록) */
      center: new window.naver.maps.LatLng(37.5550, 126.9700),
      /* 확대 레벨 (12 → 서울 전체가 적당히 보이는 정도) */
      zoom: 12,
      /* 줌 컨트롤(확대/축소 버튼) 표시 */
      zoomControl: true,
      /* 줌 컨트롤 옵션: 오른쪽 위에 작은 버튼으로 표시 */
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
        style: window.naver.maps.ZoomControlStyle.SMALL,
      },
      /* 지도 타입 컨트롤(일반/위성) 숨기기 */
      mapTypeControl: false,
      logoControl: false,
    });

    /* 만든 지도 객체를 ref에 저장 → 나중에 다른 곳에서 사용 가능 */
    mapInstanceRef.current = map;
  }, []); /* [] → 컴포넌트가 처음 화면에 나타날 때 한 번만 실행 */

  /* ── 필터 변경될 때마다 마커 다시 그리기 ── */
  /* filteredBakeries가 바뀔 때 (검색어, 지역, 카테고리 변경) 실행 */
  useEffect(() => {
    /* 지도 객체가 아직 없으면 실행하지 않음 */
    const map = mapInstanceRef.current;
    if (!map) return;

    /* --- 기존 마커 전부 제거 --- */
    /* 이전에 찍었던 마커들을 지도에서 지움 (setMap(null) → 숨기기) */
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    /* --- 기존 정보창 닫기 --- */
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    /* --- 새 마커 생성 --- */
    /* 필터링된 빵집들만 지도 위에 마커를 찍음 */
    const newMarkers = filteredBakeries.map((shop) => {
      /* 마커 생성: 빵 이모지가 들어간 커스텀 마커 */
      const marker = new window.naver.maps.Marker({
        /* 마커를 올려놓을 지도 */
        map: map,
        /* 마커 위치 (빵집의 위도, 경도) */
        position: new window.naver.maps.LatLng(shop.lat, shop.lng),
        /* 마커 아이콘 커스텀: HTML로 동그란 빵 아이콘 만들기 */
        icon: {
          content: `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 20px;
              background: #ffffff;
              border: 2.5px solid #c96442;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.18);
              cursor: pointer;
              transition: transform 0.2s;
            ">🍞</div>
          `,
          /* 마커의 기준점 (가운데) → 좌표가 마커 정중앙에 오도록 */
          anchor: new window.naver.maps.Point(20, 20),
        },
      });

      /* --- 마커에 빵집 ID 저장 --- */
      /* 나중에 마커를 클릭했을 때 어떤 빵집인지 알기 위해 */
      marker._shopId = shop.id;

      /* --- 정보창(말풍선) 만들기 --- */
      /* 마커를 클릭하면 빵집 이름, 별점, 대표메뉴가 나오는 말풍선 */
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 14px 18px;
            min-width: 180px;
            font-family: 'Pretendard', sans-serif;
            line-height: 1.5;
          ">
            <div style="font-size: 15px; font-weight: 800; color: #111; margin-bottom: 4px;">
              ${shop.name}
            </div>
            ${shop.rating > 0 ? `<div style="font-size: 12px; color: #f59e0b; margin-bottom: 4px;">
              ★ ${shop.rating} <span style="color: #aaa;">(${shop.reviewCount})</span>
            </div>` : ''}
            ${shop.signature ? `<div style="font-size: 12px; color: #666;">
              ${shop.signature}
            </div>` : ''}
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              ${shop.address}
            </div>
          </div>
        `,
        /* 말풍선 테두리 없이 깔끔하게 */
        borderWidth: 0,
        /* 말풍선 배경색 */
        backgroundColor: '#ffffff',
        /* 말풍선 그림자 */
        anchorSize: new window.naver.maps.Size(12, 12),
        /* 말풍선과 마커 사이 간격 */
        pixelOffset: new window.naver.maps.Point(0, -8),
      });

      /* --- 마커 클릭 이벤트 --- */
      /* 마커를 클릭하면: 1) 기존 정보창 닫기 2) 새 정보창 열기 3) 왼쪽 카드 선택 */
      window.naver.maps.Event.addListener(marker, 'click', () => {
        /* 이미 열려있는 정보창이 있으면 닫기 */
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        /* 새 정보창 열기 (해당 마커 위치에) */
        infoWindow.open(map, marker);
        /* 현재 열린 정보창을 ref에 저장 */
        infoWindowRef.current = infoWindow;
        /* 왼쪽 목록에서도 해당 빵집을 선택 상태로 */
        setSelectedShop(shop.id);
        /* 왼쪽 패널을 상세 패널로 전환 */
        setDetailShop(shop);
        /* 지도 중심을 마커 위치로 부드럽게 이동 */
        map.panTo(new window.naver.maps.LatLng(shop.lat, shop.lng));
      });

      return marker;
    });

    /* 새로 만든 마커들을 ref에 저장 */
    markersRef.current = newMarkers;

    /* --- 필터 결과에 맞춰 지도 범위 자동 조정 --- */
    /* 필터링된 빵집이 1개 이상이면, 모든 마커가 보이도록 지도를 맞춤 */
    if (filteredBakeries.length > 0) {
      /* LatLngBounds: 여러 좌표를 감싸는 사각형 영역 */
      const bounds = new window.naver.maps.LatLngBounds(
        /* 남서쪽 모서리 (가장 왼쪽 아래) */
        new window.naver.maps.LatLng(
          Math.min(...filteredBakeries.map(s => s.lat)),
          Math.min(...filteredBakeries.map(s => s.lng))
        ),
        /* 북동쪽 모서리 (가장 오른쪽 위) */
        new window.naver.maps.LatLng(
          Math.max(...filteredBakeries.map(s => s.lat)),
          Math.max(...filteredBakeries.map(s => s.lng))
        ),
      );
      /* fitBounds: 지정한 영역이 전부 보이도록 지도 확대/축소 자동 조정 */
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [filteredBakeries.length, activeRegion, searchKeyword, activeBadges]);
  /* ↑ 필터 조건이 바뀔 때마다 마커를 다시 그림 */

  /* ── URL 해시로 선택된 빵집이 있으면 지도를 그 위치로 이동 ── */
  /* detailShop이 설정되고 마커가 준비되면 해당 빵집으로 줌인 */
  useEffect(() => {
    const map = mapInstanceRef.current;
    /* 지도, 상세 빵집, 마커가 모두 준비됐을 때만 실행 */
    if (!map || !detailShop || markersRef.current.length === 0) return;

    /* 지도 중심을 선택된 빵집 위치로 이동 */
    map.panTo(new window.naver.maps.LatLng(detailShop.lat, detailShop.lng));
    /* 빵집이 잘 보이도록 적당히 확대 */
    map.setZoom(15);

    /* 해당 빵집의 마커를 찾아서 정보창(말풍선) 열기 */
    const targetMarker = markersRef.current.find(m => m._shopId === detailShop.id);
    if (targetMarker) {
      /* 기존에 열려있는 정보창 닫기 */
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      /* 새 정보창 만들어서 열기 */
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 14px 18px;
            min-width: 180px;
            font-family: 'Pretendard', sans-serif;
            line-height: 1.5;
          ">
            <div style="font-size: 15px; font-weight: 800; color: #111; margin-bottom: 4px;">
              ${detailShop.name}
            </div>
            ${detailShop.rating > 0 ? `<div style="font-size: 12px; color: #f59e0b; margin-bottom: 4px;">
              ★ ${detailShop.rating} <span style="color: #aaa;">(${detailShop.reviewCount})</span>
            </div>` : ''}
            ${detailShop.signature ? `<div style="font-size: 12px; color: #666;">
              ${detailShop.signature}
            </div>` : ''}
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              ${detailShop.address}
            </div>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: '#ffffff',
        anchorSize: new window.naver.maps.Size(12, 12),
        pixelOffset: new window.naver.maps.Point(0, -8),
      });
      infoWindow.open(map, targetMarker);
      infoWindowRef.current = infoWindow;
    }
  /* location.hash가 바뀔 때 + 마커가 생성된 후에 실행 */
  }, [detailShop?.id, filteredBakeries.length]);

  /* ── 카드 클릭 시 지도 이동 + 마커 정보창 열기 ── */
  /* 왼쪽 목록에서 빵집 카드를 클릭했을 때 실행되는 함수 */
  const handleCardClick = (shop) => {
    /* 1) 선택 상태 업데이트 + 상세 패널 열기 */
    setSelectedShop(shop.id);
    setDetailShop(shop);

    /* 2) 지도 객체 가져오기 */
    const map = mapInstanceRef.current;
    if (!map) return;

    /* 3) 지도 중심을 해당 빵집 위치로 부드럽게 이동 */
    map.panTo(new window.naver.maps.LatLng(shop.lat, shop.lng));

    /* 4) 지도를 적당히 확대 (빵집을 자세히 보려고) */
    /* 현재 줌이 14보다 작으면 15로 확대 */
    if (map.getZoom() < 14) {
      map.setZoom(15);
    }

    /* 5) 해당 마커의 정보창(말풍선) 열기 */
    /* markersRef에서 해당 빵집의 마커를 찾음 */
    const targetMarker = markersRef.current.find(m => m._shopId === shop.id);
    if (targetMarker) {
      /* 기존 정보창 닫기 */
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      /* 새 정보창 만들어서 열기 */
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 14px 18px;
            min-width: 180px;
            font-family: 'Pretendard', sans-serif;
            line-height: 1.5;
          ">
            <div style="font-size: 15px; font-weight: 800; color: #111; margin-bottom: 4px;">
              ${shop.name}
            </div>
            ${shop.rating > 0 ? `<div style="font-size: 12px; color: #f59e0b; margin-bottom: 4px;">
              ★ ${shop.rating} <span style="color: #aaa;">(${shop.reviewCount})</span>
            </div>` : ''}
            ${shop.signature ? `<div style="font-size: 12px; color: #666;">
              ${shop.signature}
            </div>` : ''}
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              ${shop.address}
            </div>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: '#ffffff',
        anchorSize: new window.naver.maps.Size(12, 12),
        pixelOffset: new window.naver.maps.Point(0, -8),
      });
      infoWindow.open(map, targetMarker);
      infoWindowRef.current = infoWindow;
    }
  };

  return (
    <div className="bread-map">

      {/* ===== 1. 상단 검색 + 필터 영역 ===== */}
      <div className="bm-top-bar">

        {/* ── 검색창 + 뱃지 버튼을 가로로 나란히 배치 ── */}
        <div className="bm-search-row">

          {/* 검색 입력 */}
          <div className="bm-search-wrap">
            <span className="bm-search-icon">🔍</span>
            <input
              type="text"
              className="bm-search-input"
              placeholder="빵집 이름이나 주소로 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {/* 검색어가 있을 때 X 버튼으로 지우기 */}
            {searchKeyword && (
              <button
                className="bm-search-clear"
                onClick={() => setSearchKeyword('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* ── 인증 뱃지 필터 버튼들 (블루리본, 명장, 미슐랭) ── */}
          {/* 검색창 오른쪽에 가로로 배치 */}
          <div className="bm-badge-filters">
            {badges.map((badge) => (
              <button
                key={badge.id}
                /* 선택된 뱃지면 'active' 클래스 추가 → 색이 바뀜 */
                className={`bm-badge-btn ${activeBadges.includes(badge.id) ? 'active' : ''}`}
                onClick={() => toggleBadge(badge.id)}
                /* 뱃지마다 고유 색상을 CSS 변수로 전달 */
                style={{ '--badge-color': badge.color }}
              >
                <span className="bm-badge-icon">{badge.icon}</span>
                <span className="bm-badge-name">{badge.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 지역 필터 태그들 */}
        <div className="bm-filter-row">
          <div className="bm-filter-tags">
            {regions.map((r) => (
              <button
                key={r}
                className={`bm-filter-tag ${activeRegion === r ? 'active' : ''}`}
                onClick={() => setActiveRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ===== 2. 메인 영역: 목록 + 지도 좌우 분할 ===== */}
      <div className="bm-content">

        {/* --- 왼쪽: 빵집 목록 또는 상세 패널 --- */}
        <div className="bm-list-panel">

          {/* ===== detailShop이 있으면 → 상세 패널 보여주기 ===== */}
          {/* ===== detailShop이 없으면 → 빵집 목록 보여주기 ===== */}
          {detailShop ? (
            /* ────── 빵집 상세 패널 ────── */
            /* 빵집 카드를 클릭하면 이 패널이 나타남 */
            <div className="bm-detail-panel">

              {/* --- 뒤로가기 버튼: 누르면 목록으로 돌아감 --- */}
              <button
                className="bm-detail-back"
                onClick={() => setDetailShop(null)}
              >
                ← 목록으로
              </button>

              {/* --- 빵집 이미지 영역 --- */}
              <div className="bm-detail-image">
                {detailShop.thumbnail ? (
                  <img
                    src={detailShop.thumbnail.startsWith('http')
                      ? detailShop.thumbnail
                      : `${BASE_URL}${detailShop.thumbnail}`}
                    alt={detailShop.name}
                    className="bm-detail-img"
                  />
                ) : (
                  <>
                    <span className="bm-detail-image-emoji">🍞</span>
                    <span className="bm-detail-image-text">사진 준비중</span>
                  </>
                )}
              </div>

              {/* --- 빵집 기본 정보 --- */}
              <div className="bm-detail-body">

                {/* 빵집 이름 + 카테고리 */}
                {/* 이름을 클릭하면 빵집 상세 페이지(/place/:id)로 이동 */}
                <div className="bm-detail-title-row">
                  <h2
                    className="bm-detail-name"
                    style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d6d3d1', textUnderlineOffset: '4px' }}
                    onClick={() => navigate(`/place/${detailShop.id}`)}
                  >
                    {detailShop.name}
                  </h2>
                  <span className="bm-detail-category">{detailShop.category}</span>
                </div>

                {/* 인증 뱃지 (블루리본, 천하제빵) */}
                {detailShop.badges && detailShop.badges.length > 0 && (
                  <div className="bm-detail-badges">
                    {detailShop.badges.map((badgeId) => {
                      /* badges 배열에서 해당 뱃지의 이름, 색상, 아이콘 찾기 */
                      const badgeInfo = badges.find((b) => b.id === badgeId);
                      if (!badgeInfo) return null;
                      return (
                        <span
                          key={badgeId}
                          className="bm-detail-badge"
                          style={{ '--badge-color': badgeInfo.color }}
                        >
                          {badgeInfo.icon} {badgeInfo.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 별점 + 리뷰 수 (리뷰가 있을 때만 표시) */}
                {detailShop.rating > 0 && (
                  <div className="bm-detail-rating">
                    <span className="bm-detail-stars">{renderStars(detailShop.rating)}</span>
                    <span className="bm-detail-rating-num">{detailShop.rating}</span>
                    <span className="bm-detail-review-count">리뷰 {detailShop.reviewCount}개</span>
                  </div>
                )}

                {/* 구분선 */}
                <hr className="bm-detail-divider" />

                {/* 주소 */}
                <div className="bm-detail-info-row">
                  <span className="bm-detail-info-icon">📍</span>
                  <span className="bm-detail-info-text">{detailShop.address}</span>
                </div>

                {/* 대표 메뉴 (있을 때만) */}
                {detailShop.signature && (
                  <div className="bm-detail-info-row">
                    <span className="bm-detail-info-icon">🥐</span>
                    <span className="bm-detail-info-text">{detailShop.signature}</span>
                  </div>
                )}

                {/* 구분선 */}
                <hr className="bm-detail-divider" />

                {/* --- 액션 버튼들 (좋아요, 스크랩, 공유, 길찾기) --- */}
                <div className="bm-detail-actions">
                  <button className="bm-detail-action-btn">
                    <span className="bm-action-icon">❤️</span>
                    <span className="bm-action-label">좋아요</span>
                  </button>
                  <button className="bm-detail-action-btn">
                    <span className="bm-action-icon">⭐</span>
                    <span className="bm-action-label">스크랩</span>
                  </button>
                  <button className="bm-detail-action-btn">
                    <span className="bm-action-icon">🔗</span>
                    <span className="bm-action-label">공유</span>
                  </button>
                  <button
                    className="bm-detail-action-btn"
                    onClick={() => {
                      /* 네이버 지도에서 해당 빵집 검색 (새 탭) */
                      /* 빵집 이름 + 주소로 검색 → 검색 결과에서 길찾기 가능 */
                      window.open(
                        `https://map.naver.com/v5/search/${encodeURIComponent(detailShop.name + ' ' + detailShop.address)}`,
                        '_blank'
                      );
                    }}
                  >
                    <span className="bm-action-icon">🧭</span>
                    <span className="bm-action-label">길찾기</span>
                  </button>
                </div>

                {/* 구분선 */}
                <hr className="bm-detail-divider" />

                {/* --- 리뷰 영역 --- */}
                <div className="bm-detail-review-section">
                  <h3 className="bm-detail-section-title">리뷰 {detailReviews.length > 0 && `(${detailReviews.length})`}</h3>
                  {detailReviews.length > 0 ? (
                    detailReviews.map((review) => (
                      <div key={review.REVIEW_NUM} className="bm-review-item">
                        <div className="bm-review-header">
                          <span className="bm-review-author">{review.NICKNAME || '익명'}</span>
                          <span className="bm-review-stars">{'★'.repeat(review.RATING)}{'☆'.repeat(5 - review.RATING)}</span>
                        </div>
                        <p className="bm-review-content">{review.CONTENT}</p>
                        <span className="bm-review-date">{new Date(review.CREATED_TIME).toLocaleDateString('ko-KR')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="bm-detail-no-review">아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* ────── 빵집 목록 (기존 코드) ────── */
            <>
              {/* 검색 결과 개수 */}
              <div className="bm-list-header">
                <span className="bm-result-count">
                  총 <strong>{filteredBakeries.length}</strong>개의 빵집
                </span>
              </div>

              {/* 빵집 카드 목록 (스크롤 가능) */}
              <div className="bm-list-scroll">
                {filteredBakeries.length > 0 ? (
                  filteredBakeries.map((shop) => (
                    <div
                      key={shop.id}
                      className={`bm-shop-card ${selectedShop === shop.id ? 'selected' : ''}`}
                      onClick={() => handleCardClick(shop)}
                    >
                      {/* 카드 왼쪽: 빵집 이미지 */}
                      <div className="bm-shop-thumb">
                        {shop.thumbnail ? (
                          <img
                            src={shop.thumbnail.startsWith('http')
                              ? shop.thumbnail
                              : `${BASE_URL}${shop.thumbnail}`}
                            alt={shop.name}
                            className="bm-shop-thumb-img"
                          />
                        ) : (
                          <span>🍞</span>
                        )}
                      </div>

                      {/* 카드 오른쪽: 빵집 정보 */}
                      <div className="bm-shop-info">
                        {/* 빵집 이름 + 카테고리 */}
                        <div className="bm-shop-top">
                          <span className="bm-shop-name">{shop.name}</span>
                          <span className="bm-shop-category">{shop.category}</span>
                        </div>

                        {/* 별점 + 리뷰 수 (리뷰가 있을 때만 표시) */}
                        {shop.rating > 0 && (
                          <div className="bm-shop-rating">
                            <span className="bm-stars">{renderStars(shop.rating)}</span>
                            <span className="bm-rating-num">{shop.rating}</span>
                            <span className="bm-review-count">({shop.reviewCount})</span>
                          </div>
                        )}

                        {/* 대표 메뉴 (있을 때만 표시) */}
                        {shop.signature && <p className="bm-shop-signature">{shop.signature}</p>}

                        {/* 주소 */}
                        <p className="bm-shop-address">{shop.address}</p>

                        {/* 인증 뱃지 표시 (블루리본, 명장, 미슐랭) */}
                        {shop.badges && shop.badges.length > 0 && (
                          <div className="bm-shop-badges">
                            {shop.badges.map((badgeId) => {
                              /* badges 배열에서 해당 뱃지 정보 찾기 */
                              const badgeInfo = badges.find((b) => b.id === badgeId);
                              if (!badgeInfo) return null;
                              return (
                                <span
                                  key={badgeId}
                                  className="bm-shop-badge"
                                  style={{ '--badge-color': badgeInfo.color }}
                                >
                                  {badgeInfo.icon} {badgeInfo.name}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* 태그들 (태그가 있을 때만 표시) */}
                        {shop.tags && shop.tags.length > 0 && (
                          <div className="bm-shop-tags">
                            {shop.tags.map((tag, i) => (
                              <span key={i} className="bm-shop-tag">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  /* 검색 결과가 없을 때 */
                  <div className="bm-empty">
                    <span className="bm-empty-icon">🔍</span>
                    <p className="bm-empty-title">검색 결과가 없습니다</p>
                    <p className="bm-empty-desc">다른 검색어나 필터를 사용해보세요</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- 오른쪽: 네이버 지도 영역 --- */}
        {/* ref={mapRef} → 이 div 안에 실제 네이버 지도가 그려짐! */}
        <div className="bm-map-panel">
          <div className="bm-map-area" ref={mapRef} />
        </div>
      </div>
    </div>
  );
}
