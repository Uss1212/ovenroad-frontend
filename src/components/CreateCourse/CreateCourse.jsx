/* ===================================================
   CreateCourse 컴포넌트 (코스 만들기)
   - 나만의 빵지순례 코스를 만드는 페이지
   - 구성:
     왼쪽 패널: 코스 제목/설명 입력 + 장소 검색 + 추가된 장소 목록
     오른쪽 패널: 네이버 지도 (추천 빵집 5개 마커 + 코스 경로 표시)
   - 지도 마커 클릭 → 코스에 빵집 추가
   - 검색으로 추가 빵집 찾기 → 코스에 추가
   - 코스에 추가된 빵집 이미지 중 1개를 대표 이미지로 선택
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateCourse.css';

export default function CreateCourse() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* ============================================
     상태(state) 관리
     ============================================ */

  /* 코스 제목: 사용자가 입력하는 코스 이름 */
  const [title, setTitle] = useState('');

  /* 코스 설명: 코스에 대한 소개글 */
  const [description, setDescription] = useState('');

  /* 장소 검색어: 검색창에 입력한 글자 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /* 검색 결과를 보여줄지 말지 (검색창에 포커스하면 보이고, 바깥 클릭하면 숨김) */
  const [showResults, setShowResults] = useState(false);

  /* 코스에 추가된 장소 목록 (배열) */
  /* 여기에 빵집 데이터가 하나씩 추가됨 */
  const [places, setPlaces] = useState([]);

  /* 대표 이미지로 선택된 빵집 ID */
  /* 코스에 추가된 빵집들 중 1개의 이미지를 대표 이미지로 선택 */
  const [thumbnailId, setThumbnailId] = useState(null);

  /* 지도에서 클릭한 빵집 (정보창 표시용) */
  const [selectedMapShop, setSelectedMapShop] = useState(null);

  /* ============================================
     지도 관련 참조(ref)
     ============================================ */

  /* mapRef: 네이버 지도를 그릴 div를 가리키는 참조 */
  const mapRef = useRef(null);

  /* mapInstanceRef: 생성된 네이버 지도 객체를 저장 */
  const mapInstanceRef = useRef(null);

  /* markersRef: 추천 빵집 마커들을 저장하는 배열 */
  const markersRef = useRef([]);

  /* courseLineRef: 코스 경로를 나타내는 선(폴리라인)을 저장 */
  const courseLineRef = useRef(null);

  /* courseMarkersRef: 코스에 추가된 장소의 번호 마커들을 저장 */
  const courseMarkersRef = useRef([]);

  /* ============================================
     추천 빵집 더미 데이터 (지도에 기본 핀 5개)
     - 나중에 백엔드 API에서 받아올 예정
     - image: 빵집 대표 이미지 (지금은 더미, 나중에 네이버/구글 API 이미지로 교체)
     ============================================ */
  const recommendedBakeries = [
    {
      id: 201,
      name: '베이커리 루이',
      address: '서울 마포구 와우산로 21',
      rating: 4.8,
      signature: '소금빵, 크루아상',
      image: '🍞',
      badges: ['blueribbon'],
      lat: 37.5563,
      lng: 126.9235,
    },
    {
      id: 202,
      name: '밀도',
      address: '서울 마포구 양화로 161',
      rating: 4.9,
      signature: '식빵, 밤식빵',
      image: '🍞',
      badges: ['blueribbon', 'master'],
      lat: 37.5497,
      lng: 126.9138,
    },
    {
      id: 203,
      name: '르뱅 베이커리',
      address: '서울 마포구 연남로 33',
      rating: 4.5,
      signature: '사워도우, 깜빠뉴',
      image: '🥖',
      badges: ['cheonha'],
      lat: 37.5620,
      lng: 126.9260,
    },
    {
      id: 204,
      name: '카페 레이어드',
      address: '서울 중구 을지로 170',
      rating: 4.6,
      signature: '크로플, 아메리카노',
      image: '🥐',
      badges: [],
      lat: 37.5660,
      lng: 126.9910,
    },
    {
      id: 205,
      name: '태극당',
      address: '서울 중구 동호로 24길 7',
      rating: 4.8,
      signature: '모나카, 야채샐러드빵',
      image: '🍰',
      badges: ['blueribbon', 'cheonha', 'master'],
      lat: 37.5590,
      lng: 127.0050,
    },
  ];

  /* ============================================
     추가 검색용 빵집 데이터 (검색으로만 찾을 수 있는 빵집들)
     - 지도에 기본으로 안 뜨지만, 검색하면 나오는 빵집들
     - 나중에 백엔드 API 검색으로 교체 예정
     ============================================ */
  const additionalBakeries = [
    {
      id: 301,
      name: '오월의 종',
      address: '서울 중구 을지로3가 188',
      rating: 4.5,
      signature: '마들렌, 휘낭시에',
      image: '🧁',
      badges: ['blueribbon'],
      lat: 37.5665,
      lng: 126.9930,
    },
    {
      id: 302,
      name: '나폴레옹 과자점',
      address: '서울 종로구 돈화문로 60',
      rating: 4.4,
      signature: '버터케이크, 마드레느',
      image: '🎂',
      badges: ['master'],
      lat: 37.5740,
      lng: 126.9890,
    },
    {
      id: 303,
      name: '에뚜왈 베이커리',
      address: '서울 용산구 이태원로 248',
      rating: 4.5,
      signature: '브런치세트, 팬케이크',
      image: '🥞',
      badges: ['blueribbon'],
      lat: 37.5340,
      lng: 126.9940,
    },
    {
      id: 304,
      name: '르뚝 연남',
      address: '서울 마포구 월드컵북로2길 18',
      rating: 4.7,
      signature: '크루아상, 바게트',
      image: '🥖',
      badges: ['cheonha', 'master'],
      lat: 37.5608,
      lng: 126.9247,
    },
    {
      id: 305,
      name: '홍대 빵공장',
      address: '서울 마포구 홍익로 25',
      rating: 4.3,
      signature: '마늘바게트, 치아바타',
      image: '🍞',
      badges: [],
      lat: 37.5540,
      lng: 126.9260,
    },
  ];

  /* 전체 빵집 목록: 추천 + 추가 검색용 합쳐서 검색할 수 있게 */
  const allBakeries = [...recommendedBakeries, ...additionalBakeries];

  /* ── 인증 뱃지 목록 (아이콘/색상 참조용) ── */
  const badges = [
    { id: 'blueribbon', name: '블루리본', color: '#1a73e8', icon: '🎀' },
    { id: 'cheonha',    name: '천하제빵', color: '#16a34a', icon: '🏆' },
    { id: 'master',     name: '제빵명장', color: '#f59e0b', icon: '👨‍🍳' },
  ];

  /* ============================================
     장소 관련 함수들
     ============================================ */

  /* ── 코스에 장소 추가 ── */
  /* 빵집 데이터를 받아서 코스 목록에 넣는 함수 */
  const handleAddPlace = (place) => {
    /* 이미 추가된 빵집이면 무시 (중복 방지) */
    if (places.find((p) => p.id === place.id)) return;

    /* 새 장소를 코스 목록에 추가 */
    const newPlaces = [...places, place];
    setPlaces(newPlaces);

    /* 첫 번째 장소가 추가되면 자동으로 대표 이미지로 선택 */
    if (newPlaces.length === 1) {
      setThumbnailId(place.id);
    }

    /* 검색 결과 닫기 + 검색어 초기화 */
    setSearchKeyword('');
    setShowResults(false);
  };

  /* ── 코스에서 장소 삭제 ── */
  const handleRemovePlace = (placeId) => {
    const newPlaces = places.filter((p) => p.id !== placeId);
    setPlaces(newPlaces);

    /* 삭제한 장소가 대표 이미지였으면, 첫 번째 장소로 변경 */
    if (thumbnailId === placeId) {
      setThumbnailId(newPlaces.length > 0 ? newPlaces[0].id : null);
    }
  };

  /* ── 검색 필터링 ── */
  /* 검색어로 빵집 이름이나 주소를 필터링 */
  const filteredResults = searchKeyword
    ? allBakeries.filter(
        (b) =>
          b.name.includes(searchKeyword) ||
          b.address.includes(searchKeyword) ||
          b.signature.includes(searchKeyword)
      )
    : [];

  /* ── 코스 저장 ── */
  const handleSave = () => {
    /* 제목이나 장소가 없으면 경고 */
    if (!title.trim()) {
      alert('코스 제목을 입력해주세요!');
      return;
    }
    if (places.length === 0) {
      alert('장소를 1개 이상 추가해주세요!');
      return;
    }
    console.log('코스 저장:', { title, description, places, thumbnailId });
    /* 나중에 백엔드 API로 저장 요청 후 완성 페이지로 이동 */
    navigate('/complete');
  };

  /* ── 임시 저장 ── */
  const handleDraft = () => {
    console.log('임시 저장:', { title, description, places, thumbnailId });
    alert('임시 저장되었습니다!');
  };

  /* ============================================
     네이버 지도 초기화
     - 컴포넌트가 화면에 나타날 때 한 번만 실행
     - 지도 생성 + 추천 빵집 5개 마커 표시
     ============================================ */
  useEffect(() => {
    /* naver 지도 라이브러리가 아직 로딩 안 됐으면 실행하지 않음 */
    if (!window.naver || !window.naver.maps) return;

    /* --- 지도 생성 --- */
    const map = new window.naver.maps.Map(mapRef.current, {
      /* 지도의 중심 좌표 (서울 중심) */
      center: new window.naver.maps.LatLng(37.5565, 126.9600),
      /* 확대 레벨: 12 → 서울 전체가 적당히 보이는 정도 */
      zoom: 12,
      /* 줌 컨트롤(확대/축소 버튼) 표시 */
      zoomControl: true,
      /* 줌 컨트롤 위치: 오른쪽 위에 작은 버튼 */
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
        style: window.naver.maps.ZoomControlStyle.SMALL,
      },
      /* 지도 타입 컨트롤(일반/위성) 숨기기 */
      mapTypeControl: false,
    });

    /* 만든 지도 객체를 ref에 저장 */
    mapInstanceRef.current = map;

    /* --- 추천 빵집 5개 마커 표시 --- */
    const newMarkers = recommendedBakeries.map((bakery) => {
      /* 뱃지 아이콘 모으기 (예: "🎀🏆") */
      const badgeIcons = bakery.badges
        .map((bId) => badges.find((b) => b.id === bId)?.icon || '')
        .join('');

      /* 마커 생성: 빵 이모지 + 빵집 이름 + 뱃지가 보이는 마커 */
      const marker = new window.naver.maps.Marker({
        map: map,
        position: new window.naver.maps.LatLng(bakery.lat, bakery.lng),
        icon: {
          content: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
            ">
              <div style="
                padding: 5px 10px;
                border-radius: 18px;
                background: #ffffff;
                border: 2px solid #c96442;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                white-space: nowrap;
              ">
                <span style="font-size: 16px;">${bakery.image}</span>
                <span style="font-size: 11px; font-weight: 700; color: #333;">${bakery.name}</span>
                ${badgeIcons ? `<span style="font-size: 10px;">${badgeIcons}</span>` : ''}
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid #c96442;
                margin-top: -1px;
              "></div>
            </div>
          `,
          anchor: new window.naver.maps.Point(60, 42),
        },
      });

      /* --- 마커 클릭 이벤트 --- */
      /* 마커를 클릭하면 → 해당 빵집 정보를 지도 위에 표시 + 코스에 추가 가능 */
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedMapShop(bakery);
        /* 지도 중심을 해당 빵집으로 이동 */
        map.panTo(new window.naver.maps.LatLng(bakery.lat, bakery.lng));
      });

      return marker;
    });

    /* 마커들을 ref에 저장 */
    markersRef.current = newMarkers;

    /* --- 지도 빈 곳 클릭 시 선택 해제 --- */
    window.naver.maps.Event.addListener(map, 'click', () => {
      setSelectedMapShop(null);
    });

    /* 정리 함수: 컴포넌트가 사라질 때 마커 제거 */
    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, []); /* [] → 처음 한 번만 실행 */

  /* ============================================
     코스 경로선 그리기
     - places(추가된 장소)가 바뀔 때마다 실행
     - 추가된 장소들을 선으로 연결 + 번호 마커 표시
     ============================================ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    /* --- 기존 경로선 제거 --- */
    if (courseLineRef.current) {
      courseLineRef.current.setMap(null);
    }

    /* --- 기존 번호 마커 제거 --- */
    courseMarkersRef.current.forEach((m) => m.setMap(null));
    courseMarkersRef.current = [];

    /* 장소가 없으면 여기서 끝 */
    if (places.length === 0) return;

    /* --- 코스 번호 마커 그리기 --- */
    /* 각 장소 위치에 1, 2, 3... 번호가 적힌 마커를 찍음 */
    const newCourseMarkers = places.map((place, index) => {
      return new window.naver.maps.Marker({
        map: map,
        position: new window.naver.maps.LatLng(place.lat, place.lng),
        icon: {
          content: `
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 14px;
              background: #c96442;
              color: #ffffff;
              font-size: 13px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(201,100,66,0.4);
              border: 2px solid #ffffff;
            ">${index + 1}</div>
          `,
          anchor: new window.naver.maps.Point(14, 14),
        },
        /* 번호 마커가 추천 마커보다 위에 표시되도록 */
        zIndex: 100 + index,
      });
    });

    courseMarkersRef.current = newCourseMarkers;

    /* --- 코스 경로선 그리기 (2개 이상일 때) --- */
    /* 장소들을 순서대로 선으로 연결 (점선) */
    if (places.length >= 2) {
      const path = places.map(
        (p) => new window.naver.maps.LatLng(p.lat, p.lng)
      );

      courseLineRef.current = new window.naver.maps.Polyline({
        map: map,
        path: path,
        /* 선 색상: 갈색 (빵 느낌) */
        strokeColor: '#c96442',
        /* 선 굵기 */
        strokeWeight: 3,
        /* 선 스타일: 점선 (코스 느낌) */
        strokeStyle: 'shortdash',
        /* 선 투명도: 약간 투명 */
        strokeOpacity: 0.7,
      });
    }

    /* --- 모든 장소가 보이도록 지도 범위 조정 --- */
    if (places.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds(
        new window.naver.maps.LatLng(
          Math.min(...places.map((p) => p.lat)),
          Math.min(...places.map((p) => p.lng))
        ),
        new window.naver.maps.LatLng(
          Math.max(...places.map((p) => p.lat)),
          Math.max(...places.map((p) => p.lng))
        )
      );
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [places]); /* places가 바뀔 때마다 경로선 다시 그림 */

  /* ============================================
     화면 렌더링 (JSX)
     ============================================ */
  return (
    <div className="create-course">

      {/* ===== 페이지 제목 ===== */}
      <div className="cc-header">
        <h1 className="cc-title">코스 만들기</h1>
        <p className="cc-subtitle">지도에서 빵집을 클릭하거나 검색해서 나만의 코스를 만들어보세요</p>
      </div>

      {/* ===== 메인 영역: 왼쪽 패널 + 오른쪽 지도 ===== */}
      <div className="cc-main">

        {/* ────── 왼쪽 패널: 코스 정보 입력 ────── */}
        <div className="cc-left-panel">

          {/* --- 1. 코스 제목 --- */}
          <div className="cc-field">
            <label className="cc-label">코스 제목 *</label>
            <input
              type="text"
              className="cc-input"
              placeholder="예: 을지로 숨은 빵집 탐방 코스"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* --- 2. 코스 설명 --- */}
          <div className="cc-field">
            <label className="cc-label">코스 설명</label>
            <textarea
              className="cc-textarea"
              placeholder="코스에 대한 소개를 작성해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* --- 3. 장소 검색 --- */}
          <div className="cc-field">
            <label className="cc-label">장소 추가 *</label>
            {/* 검색 입력 */}
            <div className="cc-search-wrap">
              <input
                type="text"
                className="cc-search-input"
                placeholder="🔍 빵집 이름이나 주소로 검색"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
            </div>

            {/* 검색 결과 드롭다운 */}
            {showResults && searchKeyword && (
              <div className="cc-search-results">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => {
                    /* 이미 코스에 추가된 빵집인지 확인 */
                    const isAdded = places.find((p) => p.id === result.id);
                    return (
                      <div key={result.id} className="cc-search-item">
                        {/* 빵집 이미지 아이콘 */}
                        <span className="cc-search-item-icon">{result.image}</span>
                        {/* 빵집 정보 */}
                        <div className="cc-search-item-info">
                          <span className="cc-search-item-name">{result.name}</span>
                          <span className="cc-search-item-address">{result.address}</span>
                          <span className="cc-search-item-sig">{result.signature}</span>
                        </div>
                        {/* 추가 버튼 (이미 추가된 빵집이면 "추가됨" 표시) */}
                        <button
                          className={`cc-search-add-btn ${isAdded ? 'added' : ''}`}
                          onClick={() => !isAdded && handleAddPlace(result)}
                          disabled={isAdded}
                        >
                          {isAdded ? '추가됨' : '+ 추가'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="cc-search-empty">검색 결과가 없습니다</p>
                )}
              </div>
            )}
          </div>

          {/* --- 4. 추가된 장소 목록 --- */}
          {places.length > 0 && (
            <div className="cc-field">
              <label className="cc-label">코스 장소 ({places.length}곳)</label>
              <div className="cc-place-list">
                {places.map((place, index) => (
                  <div key={place.id} className="cc-place-item">
                    {/* 순서 번호 (갈색 동그라미) */}
                    <div className="cc-place-num">{index + 1}</div>
                    {/* 빵집 이미지 아이콘 */}
                    <span className="cc-place-icon">{place.image}</span>
                    {/* 장소 정보 */}
                    <div className="cc-place-info">
                      <span className="cc-place-name">{place.name}</span>
                      <span className="cc-place-address">{place.address}</span>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      className="cc-place-remove"
                      onClick={() => handleRemovePlace(place.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 5. 대표 이미지 선택 --- */}
          {/* 코스에 빵집이 추가되면 그 빵집들 이미지 중 1개를 대표 이미지로 선택 */}
          {places.length > 0 && (
            <div className="cc-field">
              <label className="cc-label">대표 이미지 선택</label>
              <p className="cc-thumb-hint">코스 목록에 보여질 대표 이미지를 선택하세요</p>
              <div className="cc-thumb-grid">
                {places.map((place) => (
                  <div
                    key={place.id}
                    /* 선택된 이미지면 'selected' 클래스 추가 */
                    className={`cc-thumb-item ${thumbnailId === place.id ? 'selected' : ''}`}
                    onClick={() => setThumbnailId(place.id)}
                  >
                    {/* 빵집 이미지 (나중에 실제 이미지로 교체) */}
                    <div className="cc-thumb-img">{place.image}</div>
                    {/* 빵집 이름 */}
                    <span className="cc-thumb-name">{place.name}</span>
                    {/* 선택됨 표시 체크 */}
                    {thumbnailId === place.id && (
                      <div className="cc-thumb-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 6. 버튼 영역 --- */}
          <div className="cc-actions">
            <button className="cc-draft-btn" onClick={handleDraft}>
              임시 저장
            </button>
            <button className="cc-save-btn" onClick={handleSave}>
              코스 저장하기
            </button>
          </div>
        </div>

        {/* ────── 오른쪽 패널: 네이버 지도 ────── */}
        <div className="cc-right-panel">
          {/* 네이버 지도가 이 div 안에 그려짐 */}
          <div className="cc-map" ref={mapRef} />

          {/* --- 지도 위 안내 문구 --- */}
          <div className="cc-map-guide">
            🍞 마커를 클릭하면 코스에 추가할 수 있어요
          </div>

          {/* --- 지도 위 빵집 정보 팝업 (마커 클릭 시) --- */}
          {selectedMapShop && (
            <div className="cc-map-popup">
              {/* 빵집 이미지 */}
              <div className="cc-popup-img">{selectedMapShop.image}</div>
              {/* 빵집 정보 */}
              <div className="cc-popup-info">
                <span className="cc-popup-name">{selectedMapShop.name}</span>
                <span className="cc-popup-address">{selectedMapShop.address}</span>
                <span className="cc-popup-sig">⭐ {selectedMapShop.rating} · {selectedMapShop.signature}</span>
                {/* 뱃지 표시 */}
                {selectedMapShop.badges.length > 0 && (
                  <div className="cc-popup-badges">
                    {selectedMapShop.badges.map((bId) => {
                      const info = badges.find((b) => b.id === bId);
                      return info ? (
                        <span key={bId} className="cc-popup-badge" style={{ '--badge-color': info.color }}>
                          {info.icon} {info.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              {/* 코스에 추가 버튼 */}
              <button
                className={`cc-popup-add-btn ${places.find((p) => p.id === selectedMapShop.id) ? 'added' : ''}`}
                onClick={() => {
                  handleAddPlace(selectedMapShop);
                  setSelectedMapShop(null);
                }}
                disabled={!!places.find((p) => p.id === selectedMapShop.id)}
              >
                {places.find((p) => p.id === selectedMapShop.id) ? '추가됨' : '코스에 추가'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
