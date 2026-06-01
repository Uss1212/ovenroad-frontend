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
import { createCourse, updateCourse, saveDraft, updateDraft, deleteDraft, uploadCourseImage, getMyBookmarkedPlaces, BASE_URL } from '../../api/apiAxios';
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
  /* 에디터 이미지 업로드 URL (캡션과 매칭용) */
  const editorImageUrlsRef = useRef([]);
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

  const [draftNum, setDraftNum] = useState(null);
  const [editCourseNum, setEditCourseNum] = useState(null);

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

  /* 에디터 관련 */
  const editorRef = useRef(null);
  const editorFileInputRef = useRef(null);
  const [showFontSize, setShowFontSize] = useState(false);
  const [editorImages, setEditorImages] = useState([]);
  const [mainEditorImageIndex, setMainEditorImageIndex] = useState(null);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState([]);

  /* 비로그인 시 접근 차단 */
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    getMyBookmarkedPlaces()
      .then(rows => {
        setBookmarkedPlaces(rows.map(r => ({
          id: r.PLACE_NUM,
          name: r.PLACE_NAME,
          address: r.ADDRESS,
          thumbnail: r.thumbnailImage || null,
        })));
      })
      .catch(() => {});
  }, []);

  /* ============================================
     마이페이지에서 "이어서 작성" 클릭 시 임시저장 데이터 복원
     ============================================ */
  useEffect(() => {
    console.log('[DEBUG] location.state:', location.state);
    if (location.state) {
      const s = location.state;
      if (s.title) setTitle(s.title);
      if (s.description) setDescription(s.description);
      if (s.tags) setTags(s.tags);
      if (s.places) setPlaces(s.places);
      if (s.placeComments) setPlaceComments(s.placeComments);
      if (s.draftNum) setDraftNum(s.draftNum);
      if (s.courseNum) setEditCourseNum(s.courseNum);
      if (s.coverImages && s.coverImages.length > 0) {
        const isNewFormat = typeof s.coverImages[0] === 'object';
        const urls = isNewFormat ? s.coverImages.map(img => img.url) : s.coverImages;
        const captions = isNewFormat ? s.coverImages.map(img => img.caption || '') : s.coverImages.map(() => '');
        uploadedImageUrlsRef.current = urls;
        editorImageUrlsRef.current = urls;
        setUploadedImageUrls(urls);
        setCoverImages(urls.map(url => url.startsWith('http') ? url : `${BASE_URL}${url}`));
        setEditorImages(urls.map((url, i) => ({ preview: url, caption: captions[i] })));
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
              thumbnail: p.thumbnailImage || null,
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
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && tagInput.trim()) {
      e.preventDefault();
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
     에디터 기능
     ============================================ */
  const execCmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleEditorImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result;
      setEditorImages(prev => [...prev, { preview, caption: '' }]);
      if (mainEditorImageIndex === null) {
        setMainEditorImageIndex(0);
        setCoverImages([preview]);
      }
    };
    reader.readAsDataURL(file);
    try {
      const uploadResult = await uploadCourseImage(file);
      if (uploadResult?.imageUrl) {
        const url = uploadResult.imageUrl.startsWith('http') ? uploadResult.imageUrl : `${BASE_URL}${uploadResult.imageUrl}`;
        uploadedImageUrlsRef.current = [...uploadedImageUrlsRef.current, url];
        editorImageUrlsRef.current = [...editorImageUrlsRef.current, url];
        setUploadedImageUrls([...uploadedImageUrlsRef.current]);
      }
    } catch (err) {
      console.error('에디터 이미지 업로드 실패:', err);
    }
    e.target.value = '';
  };

  const handleSetMainImage = (index) => {
    setMainEditorImageIndex(index);
    setCoverImages([editorImages[index].preview]);
    setMainImageIndex(0);
  };

  const handleRemoveEditorImage = (index) => {
    setEditorImages(prev => prev.filter((_, i) => i !== index));
    editorImageUrlsRef.current = editorImageUrlsRef.current.filter((_, i) => i !== index);
    if (mainEditorImageIndex === index) {
      setMainEditorImageIndex(null);
      setCoverImages([]);
    } else if (mainEditorImageIndex > index) {
      setMainEditorImageIndex(prev => prev - 1);
    }
  };

  const handleFontSize = (size) => {
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    const fonts = editorRef.current?.querySelectorAll('font[size="7"]');
    if (fonts) {
      fonts.forEach(el => {
        el.removeAttribute('size');
        el.style.fontSize = size + 'px';
      });
    }
    setShowFontSize(false);
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

  /* 드래그앤드롭 순서 변경 */
  const dragIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverIndexRef.current = index;
  };

  const handleDragEnd = () => {
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    if (from === null || to === null || from === to) {
      dragIndexRef.current = null;
      dragOverIndexRef.current = null;
      return;
    }
    const updated = [...places];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPlaces(updated);
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
  };

  /* 코스 최적화 (최근접 이웃 알고리즘) */
  const optimizeCourseOrder = () => {
    if (places.length < 3) return;

    const toRad = (deg) => deg * Math.PI / 180;
    const getDistance = (a, b) => {
      const R = 6371;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    const remaining = [...places];
    const result = [remaining.shift()];
    while (remaining.length > 0) {
      const last = result[result.length - 1];
      let nearest = 0;
      let minDist = Infinity;
      remaining.forEach((p, i) => {
        const d = getDistance(last, p);
        if (d < minDist) { minDist = d; nearest = i; }
      });
      result.push(remaining.splice(nearest, 1)[0]);
    }
    setPlaces(result);
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

    const editorContent = editorRef.current?.innerHTML || '';
    const payload = {
      userNum: user.userNum,
      title: title.trim(),
      subtitle: description.trim() || title.trim(),
      content: editorContent || description.trim(),
      tags,
      coverImage: uploadedImageUrls.length > 0 ? uploadedImageUrls[mainImageIndex] || uploadedImageUrls[0] : null,
      coverImages: editorImageUrlsRef.current.map((url, i) => ({
        url,
        caption: editorImages[i]?.caption || ''
      })),
      places: places.map((place, index) => ({
        placeNum: place.id,
        order: index + 1,
        memo: placeComments[place.id] || '',
        isThumbnail: index === 0,
      })),
    };

    try {
      let courseNum;
      if (editCourseNum) {
        await updateCourse(editCourseNum, payload);
        courseNum = editCourseNum;
      } else {
        const result = await createCourse(payload);
        courseNum = result.courseNum;
        if (draftNum) {
          try { await deleteDraft(draftNum); } catch {}
        }
      }
      navigate(`/courses/${courseNum}`);
    } catch (err) {
      alert((editCourseNum ? '코스 수정에 실패했습니다: ' : '코스 발행에 실패했습니다: ') + err.message);
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
        coverImages: editorImageUrlsRef.current.map((url, i) => ({
          url,
          caption: editorImages[i]?.caption || ''
        })),
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
        zoomControl: false,
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

      {/* ===== 상단 서브헤더 ===== */}
      <div className="cc-top-bar">
        <button className="cc-back-arrow" onClick={() => navigate(-1)}>‹</button>
        {!editCourseNum && (
          <button className="cc-draft-btn" onClick={handleDraft}>
            임시저장
          </button>
        )}
        <button className="cc-publish-btn" onClick={handlePublish}>
          {editCourseNum ? '수정 완료' : '완료'}
        </button>
      </div>

      {/* ===== 본문 영역 ===== */}
      <div className="cc-body">

        {/* --- 히어로 섹션: 이미지 + 제목 + 부제목 + 태그 --- */}
        <div className="cc-hero-section">
          {coverImages.length > 0 && (
            <img src={coverImages[mainImageIndex] || coverImages[0]} alt="커버" className="cc-hero-bg" />
          )}
          <div className="cc-hero-overlay" />

          <div className="cc-hero-content">
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

            {/* 제목 입력 */}
            <input
              type="text"
              className="cc-title-input"
              placeholder="코스 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* 부제목/설명 입력 */}
            <textarea
              className="cc-desc-input"
              placeholder="부제목을 입력해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
            />

            {/* 태그 */}
            <div className="cc-tag-section">
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
          </div>
        </div>

        {/* 글 에디터 영역 */}
        <div className="cc-editor-area">
          {editorImages.length === 0 && (
            <div className="cc-editor-empty" onClick={() => editorFileInputRef.current?.click()}>
              사진을 추가하고 글을 작성해보세요...
            </div>
          )}
          {editorImages.map((img, index) => (
            <div key={index} className="cc-editor-block">
              <div className="cc-editor-img-wrap">
                <img src={img.preview} alt={`에디터 이미지 ${index + 1}`} />
                <button
                  className={`cc-editor-main-btn ${mainEditorImageIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSetMainImage(index)}
                >
                  {mainEditorImageIndex === index ? '✓ 대표' : '대표'}
                </button>
                <button className="cc-editor-del-btn" onClick={() => handleRemoveEditorImage(index)}>
                  <i className="fi fi-rr-trash"></i>
                </button>
              </div>
              <input
                type="text"
                className="cc-editor-caption"
                placeholder="사진 제목을 입력하세요"
                value={img.caption}
                onChange={(e) => {
                  const updated = [...editorImages];
                  updated[index].caption = e.target.value;
                  setEditorImages(updated);
                }}
              />
            </div>
          ))}
          <div
            ref={editorRef}
            className="cc-editor-text"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="글을 작성해보세요..."
          />
        </div>
        <input ref={editorFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditorImage} />

        {/* 에디터 툴바 */}
        <div className="cc-editor-toolbar">
          <button className="cc-toolbar-btn" onClick={() => editorFileInputRef.current?.click()}>
            <i className="fi fi-rr-picture"></i> 사진추가
          </button>
          <span className="cc-toolbar-divider" />
          <div className="cc-fontsize-wrap">
            <button className="cc-toolbar-btn" onClick={() => setShowFontSize(!showFontSize)}>14 ▾</button>
            {showFontSize && (
              <div className="cc-fontsize-dropdown">
                {[12, 14, 16, 18, 20, 24, 28, 32].map(s => (
                  <button key={s} className="cc-fontsize-option" onClick={() => handleFontSize(s)}>{s}px</button>
                ))}
              </div>
            )}
          </div>
          <span className="cc-toolbar-divider" />
          <button className="cc-toolbar-btn" style={{ fontWeight: 700 }} onClick={() => execCmd('bold')}>B</button>
          <button className="cc-toolbar-btn" style={{ fontStyle: 'italic' }} onClick={() => execCmd('italic')}>i</button>
          <button className="cc-toolbar-btn" style={{ textDecoration: 'underline' }} onClick={() => execCmd('underline')}>U</button>
          <button className="cc-toolbar-btn" style={{ textDecoration: 'line-through' }} onClick={() => execCmd('strikeThrough')}>T</button>
          <span className="cc-toolbar-divider" />
          <button className="cc-toolbar-btn" onClick={() => execCmd('justifyLeft')}>≡</button>
        </div>

        {/* ===== 하단: 검색 + 장소 카드 좌우 분할 ===== */}
        <div className="cc-map-section">

          {/* --- 왼쪽: 지도 (검색은 지도 안에 오버레이) --- */}
          <div className="cc-map-left">
            <div className="cc-map-area" ref={mapRef} />

            {/* 검색바 (지도 위에 플로팅) */}
            <div className="cc-map-search-bar" style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 15, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
              <input
                type="text"
                className="cc-map-search-input"
                placeholder="정확한 빵집 이름이나 지점을 입력해주세요 (예 : 성심당 본점)"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              <span className="cc-search-icon"><i className="fi fi-rr-search"></i></span>
            </div>

            {/* 검색 오버레이 (지도 위에 뜸) */}
            {showResults && (
              <div className="cc-search-overlay" style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 20, background: '#fff', maxHeight: 'calc(100% - 86px)', overflowY: 'auto', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                {searchKeyword && (
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
                              {isAdded ? '추가됨' : '+'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="cc-map-search-empty">검색 결과가 없습니다</p>
                    )}
                  </div>
                )}
                <div className="cc-saved-section">
                  <h3 className="cc-saved-title">내가 저장했던 빵집</h3>
                  {bookmarkedPlaces.length > 0 ? (
                    <div className="cc-saved-list">
                      {bookmarkedPlaces.map((b) => {
                        const isAdded = places.find((p) => p.id === b.id);
                        return (
                          <div key={b.id} className="cc-saved-item" onClick={() => !isAdded && handleAddPlace(b)}>
                            <div className="cc-saved-item-info">
                              <span className="cc-saved-item-name">{b.name}</span>
                              <span className="cc-saved-item-addr">{b.address}</span>
                            </div>
                            <span className="cc-saved-item-btn">{isAdded ? '추가됨' : '추가'}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="cc-saved-empty">저장한 빵집이 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* 지도 위 빵집 팝업 */}
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
                {places.length >= 3 && (
                  <div className="cc-optimize-bar">
                    <button className="cc-optimize-btn" onClick={optimizeCourseOrder}>
                      📍 코스 순서 최적화
                    </button>
                    <span className="cc-optimize-hint">가까운 장소끼리 순서를 자동 정렬합니다</span>
                  </div>
                )}
                {places.map((place, index) => (
                  <div
                    key={place.id}
                    className="cc-place-card"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="cc-place-thumb">
                      {place.thumbnail ? (
                        <img src={place.thumbnail} alt={place.name} />
                      ) : (
                        <span className="cc-place-thumb-placeholder">🍞</span>
                      )}
                    </div>
                    <div className="cc-place-card-body">
                      <div className="cc-place-card-header">
                        <span className="cc-place-drag-handle">☰</span>
                        <span className="cc-place-name">{place.name}</span>
                        <button
                          className="cc-place-remove"
                          onClick={() => handleRemovePlace(place.id)}
                        >
                          ✕
                        </button>
                      </div>
                      <span className="cc-place-addr">{place.address}</span>
                      <input
                        type="text"
                        className="cc-comment-input"
                        placeholder="이 장소에 대한 코멘트를 남겨주세요."
                        value={placeComments[place.id] || ''}
                        onChange={(e) => handleCommentChange(place.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== 댓글 섹션 ===== */}
        <div className="cc-comments-section">
          <div className="cc-comments-header">
            <h2 className="cc-comments-title">댓글 0개</h2>
            <span className="cc-comments-count">0건 작성</span>
          </div>
          <div className="cc-comments-input-wrap">
            <div className="cc-comments-avatar" />
            <input
              type="text"
              className="cc-comments-input"
              placeholder="댓글 작성"
            />
            <div className="cc-comments-btns">
              <button className="cc-comments-cancel-btn">취소</button>
              <button className="cc-comments-submit-btn">작성완료</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
