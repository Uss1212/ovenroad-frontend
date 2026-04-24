/* ===================================================
   CreateCourse 컴포넌트 (코스 만들기)
   - 피그마 디자인 기반 세로 레이아웃
   - 구성:
     상단: 임시저장 + 발행하기 버튼
     본문: 이미지 업로드 → 제목 → 작성자 → 설명 → 태그
     하단: 지도(왼쪽) + 장소 추가(오른쪽) 좌우 분할
   =================================================== */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCourse, saveDraft, updateDraft, deleteDraft, uploadCourseImage, BASE_URL } from '../../api/apiAxios'; /* 코스 만들기 + 임시저장 + 수정 + 삭제 + 이미지 업로드 API + 서버 주소 */
import { createMarkerClustering } from '../../utils/MarkerClustering'; /* 마커 클러스터링 (가까운 마커끼리 묶어서 표시) */
import './CreateCourse.css';

export default function CreateCourse() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();
  const location = useLocation();

  /* ============================================
     상태(state) 관리
     ============================================ */

  /* 코스 제목 */
  const [title, setTitle] = useState('');

  /* 코스 설명 */
  const [description, setDescription] = useState('');

  /* 태그 목록 (배열) */
  const [tags, setTags] = useState([]);

  /* 태그 입력 중인 텍스트 */
  const [tagInput, setTagInput] = useState('');

  /* 업로드된 이미지 목록 (미리보기 URL 배열) */
  const [coverImages, setCoverImages] = useState([]);
  /* 서버에 업로드된 이미지 URL 목록 (실제 저장 경로) */
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  /* ref로도 동일하게 관리 (state는 비동기라서 임시저장 시 최신값을 바로 읽기 위해) */
  const uploadedImageUrlsRef = useRef([]);
  /* 현재 업로드 진행 중인 개수 */
  const pendingUploadsRef = useRef(0);
  /* 대표이미지 인덱스 (기본값: 첫 번째 이미지) */
  const [mainImageIndex, setMainImageIndex] = useState(0);

  /* 장소 검색어 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /* 검색 결과 보여줄지 말지 */
  const [showResults, setShowResults] = useState(false);

  /* 코스에 추가된 장소 목록 */
  const [places, setPlaces] = useState([]);

  /* 각 장소별 코멘트 (장소 id → 코멘트 텍스트) */
  const [placeComments, setPlaceComments] = useState({});

  /* 임시저장 번호 (이어서 작성 시 기존 임시저장을 수정하기 위해) */
  const [draftNum, setDraftNum] = useState(null);

  /* 지도에서 클릭한 빵집 (정보창 표시용) */
  const [selectedMapShop, setSelectedMapShop] = useState(null);

  /* ============================================
     지도 관련 참조(ref)
     ============================================ */
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const clusterRef = useRef(null); /* 마커 클러스터링 객체 (가까운 마커끼리 묶음) */
  const courseLineRef = useRef(null);
  const courseMarkersRef = useRef([]);

  /* 이미지 업로드 input 참조 (숨겨진 input을 클릭하기 위해) */
  const fileInputRef = useRef(null);

  /* 비로그인 시 접근 차단 */
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [navigate]);

  /* ============================================
     마이페이지에서 "이어서 작성" 클릭 시 임시저장 데이터 복원
     ============================================ */
  useEffect(() => {
    if (location.state) {
      const s = location.state;
      if (s.title) setTitle(s.title);
      if (s.description) setDescription(s.description);
      if (s.tags) setTags(s.tags);
      if (s.places) setPlaces(s.places);
      if (s.placeComments) setPlaceComments(s.placeComments);
      /* 임시저장 번호 기억 (다시 임시저장 시 덮어쓰기 위해) */
      if (s.draftNum) setDraftNum(s.draftNum);
      /* 임시저장된 이미지 URL 복원 */
      if (s.coverImages && s.coverImages.length > 0) {
        uploadedImageUrlsRef.current = s.coverImages;
        setUploadedImageUrls(s.coverImages);
        setCoverImages(s.coverImages.map(url => url.startsWith('http') ? url : `${BASE_URL}${url}`));
      }
    }
  }, []);

  /* ============================================
     DB에서 빵집 데이터 가져오기
     ============================================ */
  const [bakeries, setBakeries] = useState([]);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const res = await fetch(`${BASE_URL}/api/places`);
        const data = await res.json();
        const mapped = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .map(p => {
            const badgeList = [];
            if (p.ribbonCount && p.ribbonCount > 0) badgeList.push('blueribbon');
            return {
              id: p.PLACE_NUM,
              name: p.PLACE_NAME,
              category: p.categoryName || '베이커리',
              address: p.ADDRESS,
              rating: p.avgRating ? Number(p.avgRating).toFixed(1) : 0,
              reviewCount: p.reviewCount || 0,
              signature: '',
              badges: badgeList,
              lat: parseFloat(p.LATITUDE),
              lng: parseFloat(p.LONGITUDE),
            };
          });
        setBakeries(mapped);
      } catch (err) {
        console.error('빵집 데이터 불러오기 실패:', err);
      }
    }
    fetchPlaces();
  }, []);

  /* ── 인증 뱃지 목록 ── */
  const badges = [
    { id: 'blueribbon', name: '블루리본', color: '#1a73e8', icon: '🎀' },
    { id: 'cheonha',    name: '천하제빵', color: '#16a34a', icon: '🏆' },
  ];

  /* ============================================
     이미지 업로드 처리
     ============================================ */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    /* 1) 미리보기용 URL 만들기 (화면에 바로 표시) */
    const reader = new FileReader();
    reader.onload = () => setCoverImages(prev => [...prev, reader.result]);
    reader.readAsDataURL(file);

    /* 2) 서버에 이미지 파일 업로드 (실제 저장) */
    try {
      pendingUploadsRef.current += 1;
      const uploadResult = await uploadCourseImage(file);
      if (uploadResult && uploadResult.imageUrl) {
        uploadedImageUrlsRef.current = [...uploadedImageUrlsRef.current, uploadResult.imageUrl];
        setUploadedImageUrls([...uploadedImageUrlsRef.current]);
      } else {
        console.error('업로드 응답에 imageUrl이 없음:', uploadResult);
      }
      pendingUploadsRef.current -= 1;
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      pendingUploadsRef.current -= 1;
    }

    /* input 값 초기화 (같은 파일 다시 선택 가능하게) */
    e.target.value = '';
  };

  /* 이미지 삭제 */
  const handleRemoveImage = (index) => {
    setCoverImages(prev => prev.filter((_, i) => i !== index));
    uploadedImageUrlsRef.current = uploadedImageUrlsRef.current.filter((_, i) => i !== index);
    setUploadedImageUrls([...uploadedImageUrlsRef.current]);
  };

  /* ============================================
     태그 추가 (엔터 키로)
     ============================================ */
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      /* 중복 태그 방지 */
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  /* 태그 삭제 */
  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  /* ============================================
     장소 관련 함수들
     ============================================ */

  /* 코스에 장소 추가 */
  const handleAddPlace = (place) => {
    if (places.find((p) => p.id === place.id)) return;
    setPlaces([...places, place]);
    setSearchKeyword('');
    setShowResults(false);
  };

  /* 코스에서 장소 삭제 */
  const handleRemovePlace = (placeId) => {
    setPlaces(places.filter((p) => p.id !== placeId));
    /* 해당 장소 코멘트도 삭제 */
    const newComments = { ...placeComments };
    delete newComments[placeId];
    setPlaceComments(newComments);
  };

  /* 장소 코멘트 변경 */
  const handleCommentChange = (placeId, text) => {
    setPlaceComments({ ...placeComments, [placeId]: text });
  };

  /* 검색 필터링: DB에서 가져온 빵집 목록에서 검색 */
  const filteredResults = searchKeyword
    ? bakeries.filter(
        (b) =>
          b.name.includes(searchKeyword) ||
          b.address.includes(searchKeyword)
      ).slice(0, 10)
    : [];

  /* 코스 발행하기 */
  const handlePublish = async () => {
    /* 로그인 확인 */
    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('로그인이 필요합니다!');
      navigate('/login');
      return;
    }
    const user = JSON.parse(userData);

    if (!title.trim() || title.trim().length < 5) {
      alert('코스 제목을 5글자 이상 입력해주세요!');
      return;
    }
    if (places.length === 0) {
      alert('장소를 1개 이상 추가해주세요!');
      return;
    }

    try {
      /* 서버에 코스 저장 요청 */
      const result = await createCourse({
        userNum: user.userNum,
        title: title.trim(),
        subtitle: description.trim() || title.trim(),
        content: description.trim(),
        /* 업로드된 이미지 전체를 JSON 배열로 전달 */
        coverImage: uploadedImageUrls.length > 0 ? uploadedImageUrls[mainImageIndex] || uploadedImageUrls[0] : null,
        coverImages: uploadedImageUrls,
        places: places.map((place, index) => ({
          placeNum: place.id,
          order: index + 1,
          memo: placeComments[place.id] || '',
          isThumbnail: index === 0,
        })),
      });

      /* 임시저장에서 발행한 경우 임시저장 삭제 */
      if (draftNum) {
        try { await deleteDraft(draftNum); } catch {}
      }

      /* 만든 코스 상세 페이지로 바로 이동 */
      navigate(`/courses/${result.courseNum}`);
    } catch (err) {
      alert('코스 발행에 실패했습니다: ' + err.message);
    }
  };

  /* 임시 저장 → DB에 저장 */
  const handleDraft = async () => {
    /* 로그인 확인 */
    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('로그인이 필요합니다!');
      navigate('/login');
      return;
    }
    const user = JSON.parse(userData);

    try {
      /* 업로드 진행 중이면 잠깐 대기 (최대 3초) */
      if (pendingUploadsRef.current > 0) {
        alert('이미지 업로드 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      /* ref에서 최신 이미지 URL 읽기 (state보다 확실) */
      console.log('임시저장 coverImages:', uploadedImageUrlsRef.current);
      const result = await saveDraft({
        userNum: user.userNum,
        draftNum: draftNum || null,
        title: title.trim(),
        description: description.trim(),
        tags,
        places: places.map((p) => ({ id: p.id, name: p.name, address: p.address, lat: p.lat, lng: p.lng })),
        placeComments,
        coverImages: uploadedImageUrlsRef.current,
      });
      /* 새로 생성된 경우 draftNum 기억 (다음 저장 시 중복 방지) */
      if (result.draftNum) setDraftNum(result.draftNum);
      alert('임시저장되었습니다! 마이페이지에서 확인할 수 있어요.');
    } catch (err) {
      alert('임시저장에 실패했습니다: ' + err.message);
    }
  };

  /* ============================================
     네이버 지도 초기화
     ============================================ */
  useEffect(() => {
    if (!window.naver || !window.naver.maps) return;
    if (bakeries.length === 0) return;

    /* 이미 지도가 있으면 마커만 업데이트 */
    let map = mapInstanceRef.current;
    if (!map) {
      map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5550, 126.9700),
        zoom: 12,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
          style: window.naver.maps.ZoomControlStyle.SMALL,
        },
        mapTypeControl: false,
      });
      mapInstanceRef.current = map;

      /* 지도 빈 곳 클릭 시 선택 해제 */
      window.naver.maps.Event.addListener(map, 'click', () => {
        setSelectedMapShop(null);
      });
    }

    /* 기존 마커 + 클러스터 제거 */
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }

    /* DB 빵집 마커 생성 (지도에 바로 안 붙이고, 클러스터링에 넘김) */
    const newMarkers = bakeries.map((bakery) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(bakery.lat, bakery.lng),
        icon: {
          content: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 18px;
              background: #ffffff;
              border: 2px solid #c96442;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              cursor: pointer;
            ">🍞</div>
          `,
          anchor: new window.naver.maps.Point(18, 18),
        },
      });

      /* 마커 클릭 → 팝업 표시 */
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedMapShop(bakery);
        map.panTo(new window.naver.maps.LatLng(bakery.lat, bakery.lng));
      });

      return marker;
    });

    markersRef.current = newMarkers;

    /* 마커 클러스터링 적용 (가까운 마커끼리 묶어서 숫자로 표시) */
    clusterRef.current = createMarkerClustering(map, newMarkers, {
      gridSize: 120,
      maxZoom: 16,
    });
  }, [bakeries]);

  /* ============================================
     코스 경로선 그리기 (places 변경 시)
     ============================================ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    /* 기존 경로선 + 번호 마커 제거 */
    if (courseLineRef.current) {
      courseLineRef.current.setMap(null);
    }
    courseMarkersRef.current.forEach((m) => m.setMap(null));
    courseMarkersRef.current = [];

    if (places.length === 0) return;

    /* 코스 번호 마커 */
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
        zIndex: 100 + index,
      });
    });
    courseMarkersRef.current = newCourseMarkers;

    /* 경로선 (2개 이상일 때) */
    if (places.length >= 2) {
      const path = places.map(
        (p) => new window.naver.maps.LatLng(p.lat, p.lng)
      );
      courseLineRef.current = new window.naver.maps.Polyline({
        map: map,
        path: path,
        strokeColor: '#c96442',
        strokeWeight: 3,
        strokeStyle: 'shortdash',
        strokeOpacity: 0.7,
      });
    }

    /* 모든 장소가 보이도록 지도 범위 조정 */
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
  }, [places]);

  /* ============================================
     화면 렌더링 (JSX) - 피그마 디자인 기반
     ============================================ */
  return (
    <div className="create-course">

      {/* ===== 상단 버튼 바 ===== */}
      {/* 오른쪽 정렬: 임시저장 + 발행하기 */}
      <div className="cc-top-bar">
        <button className="cc-draft-btn" onClick={handleDraft}>
          임시저장
        </button>
        <button className="cc-publish-btn" onClick={handlePublish}>
          발행하기
        </button>
      </div>

      {/* ===== 본문 영역 ===== */}
      <div className="cc-body">

        {/* --- 1. 이미지 업로드 (가로 나열) --- */}
        {/* + 버튼이 항상 맨 왼쪽, 추가된 이미지들은 오른쪽으로 나열 */}
        <div className="cc-cover-row">
          {/* + 버튼: 항상 맨 왼쪽에 위치 */}
          <div
            className="cc-cover-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="cc-cover-placeholder">
              <span className="cc-cover-plus">+</span>
            </div>
          </div>
          {/* 추가된 이미지들이 오른쪽으로 나열 */}
          {coverImages.map((img, index) => (
            <div key={index} className="cc-cover-item">
              <img src={img} alt={`이미지 ${index + 1}`} className="cc-cover-preview" />
              <button
                className={`cc-cover-star ${mainImageIndex === index ? 'cc-cover-star-active' : ''}`}
                onClick={() => setMainImageIndex(index)}
                title="대표이미지로 설정"
              >
                ★
              </button>
              <button
                className="cc-cover-remove"
                onClick={() => {
                  handleRemoveImage(index);
                  if (mainImageIndex === index) setMainImageIndex(0);
                  else if (mainImageIndex > index) setMainImageIndex(prev => prev - 1);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {/* 숨겨진 파일 input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {/* --- 2. 코스 제목 --- */}
        <input
          type="text"
          className="cc-title-input"
          placeholder="코스 제목을 입력하세요. (최소 입력 글자 5글자 이상)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* --- 3. 작성자 정보 (로그인한 사용자 닉네임) --- */}
        <div className="cc-author-row">
          <div className="cc-author-avatar"></div>
          <span className="cc-author-name">
            {(() => {
              try {
                const u = JSON.parse(localStorage.getItem('user'));
                return u?.nickname || '작성자';
              } catch { return '작성자'; }
            })()}
          </span>
        </div>

        {/* --- 4. 세부 내용 입력 --- */}
        <textarea
          className="cc-desc-input"
          placeholder="세부 내용을 입력해주세요."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* --- 5. 태그 추가 --- */}
        <div className="cc-tag-section">
          {/* 이미 추가된 태그들 */}
          {tags.length > 0 && (
            <div className="cc-tag-list">
              {tags.map((tag, i) => (
                <span key={i} className="cc-tag-item">
                  #{tag}
                  <button className="cc-tag-remove" onClick={() => handleRemoveTag(i)}>✕</button>
                </span>
              ))}
            </div>
          )}
          {/* 태그 입력 */}
          <div className="cc-tag-input-wrap">
            <span className="cc-tag-plus">+</span>
            <input
              type="text"
              className="cc-tag-input"
              placeholder="태그 추가 (엔터로 자동 추가)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>

        {/* ===== 하단: 지도 + 장소 추가 좌우 분할 ===== */}
        <div className="cc-map-section">

          {/* --- 왼쪽: 지도 --- */}
          <div className="cc-map-left">
            {/* 지도 위 검색바 */}
            <div className="cc-map-search-bar">
              <input
                type="text"
                className="cc-map-search-input"
                placeholder="상호명 빵집 이름이나 지점을 입력해주세요 (예 : 성심당 본점)"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              {/* 검색 결과 드롭다운 */}
              {showResults && searchKeyword && (
                <div className="cc-map-search-results">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => {
                      const isAdded = places.find((p) => p.id === result.id);
                      return (
                        <div
                          key={result.id}
                          className="cc-map-search-item"
                          onClick={() => !isAdded && handleAddPlace(result)}
                        >
                          <div className="cc-map-search-item-info">
                            <span className="cc-map-search-item-name">{result.name}</span>
                            <span className="cc-map-search-item-addr">{result.address}</span>
                          </div>
                          <span className={`cc-map-search-item-btn ${isAdded ? 'added' : ''}`}>
                            {isAdded ? '추가됨' : '+ 추가'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="cc-map-search-empty">검색 결과가 없습니다</p>
                  )}
                </div>
              )}
            </div>

            {/* 네이버 지도 */}
            <div className="cc-map-area" ref={mapRef} />

            {/* 지도 위 빵집 정보 팝업 (마커 클릭 시) */}
            {selectedMapShop && (
              <div className="cc-map-popup">
                <div className="cc-popup-info">
                  <span className="cc-popup-name">{selectedMapShop.name}</span>
                  <span className="cc-popup-address">{selectedMapShop.address}</span>
                  {selectedMapShop.rating > 0 && (
                    <span className="cc-popup-rating">⭐ {selectedMapShop.rating}</span>
                  )}
                </div>
                <button
                  className={`cc-popup-add-btn ${places.find((p) => p.id === selectedMapShop.id) ? 'added' : ''}`}
                  onClick={() => {
                    handleAddPlace(selectedMapShop);
                    setSelectedMapShop(null);
                  }}
                  disabled={!!places.find((p) => p.id === selectedMapShop.id)}
                >
                  {places.find((p) => p.id === selectedMapShop.id) ? '추가됨' : '+ 추가'}
                </button>
              </div>
            )}
          </div>

          {/* --- 오른쪽: 장소 목록 + 코멘트 --- */}
          <div className="cc-place-right">
            {places.length === 0 ? (
              /* 장소가 없을 때 안내 문구 */
              <div className="cc-place-empty">
                <span className="cc-place-empty-icon">☰</span>
                <p className="cc-place-empty-text">장소를 추가해주세요.</p>
                <p className="cc-place-empty-sub">-</p>
                <div className="cc-place-empty-comment">
                  <input
                    type="text"
                    className="cc-comment-input"
                    placeholder="이 장소에 대한 코멘트를 남겨주세요."
                    disabled
                  />
                </div>
              </div>
            ) : (
              /* 추가된 장소 목록 */
              <div className="cc-place-list">
                {places.map((place, index) => (
                  <div key={place.id} className="cc-place-card">
                    {/* 장소 정보 행: 번호 + 이름 + 삭제 */}
                    <div className="cc-place-card-header">
                      <div className="cc-place-num">{index + 1}</div>
                      <span className="cc-place-name">{place.name}</span>
                      <span className="cc-place-addr">{place.address}</span>
                      <button
                        className="cc-place-remove"
                        onClick={() => handleRemovePlace(place.id)}
                      >
                        ✕
                      </button>
                    </div>
                    {/* 장소별 코멘트 입력 */}
                    <input
                      type="text"
                      className="cc-comment-input"
                      placeholder="이 장소에 대한 코멘트를 남겨주세요."
                      value={placeComments[place.id] || ''}
                      onChange={(e) => handleCommentChange(place.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
