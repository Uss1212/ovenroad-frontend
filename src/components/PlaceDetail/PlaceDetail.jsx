/* ===================================================
   PlaceDetail 컴포넌트 (빵집 상세 페이지)
   - URL: /place/:id
   - 히어로 + 기본정보 + 사진 갤러리 + 매장정보 + 메뉴 + 코스 + 리뷰
   =================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/api';
import './PlaceDetail.css';

export default function PlaceDetail() {

  /* URL에서 빵집 ID 가져오기 */
  const { id } = useParams();
  const navigate = useNavigate();

  /* 상태 관리 */
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  /* 리뷰 작성 모달 */
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  /* 로그인 사용자 */
  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;

  /* 좋아요 + 공유 상태 */
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  /* 사진 갤러리 라이트박스 (클릭하면 크게 보기) */
  const [lightboxIdx, setLightboxIdx] = useState(-1);

  /* 기본 히어로 이미지 */
  const defaultHero = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=400&fit=crop';

  /* 이미지 URL 만들기 (http로 시작하면 그대로, 아니면 서버 주소 붙이기) */
  const imgUrl = (url) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

  /* 백엔드 API에서 빵집 데이터 가져오기 */
  const fetchPlace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/places/${id}`);
      if (!res.ok) { setPlace(null); return; }
      const data = await res.json();

      const categoryName = data.categories && data.categories.length > 0
        ? data.categories[0].CATEGORY_NAME : '베이커리';
      const ribbonCount = data.categories && data.categories.length > 0
        ? data.categories[0].RIBBON_COUNT : 0;

      setPlace({
        id: data.PLACE_NUM,
        name: data.PLACE_NAME,
        category: categoryName,
        address: data.ADDRESS || '주소 정보 없음',
        rating: data.avgRating ? Number(data.avgRating).toFixed(1) : '0.0',
        reviewCount: data.reviewCount || 0,
        lat: parseFloat(data.LATITUDE),
        lng: parseFloat(data.LONGITUDE),
        hasRibbon: ribbonCount && ribbonCount > 0,
        images: data.images || [],
        courses: data.courses || [],
        menus: data.menus || [],
      });

      setReviews(data.reviews || []);
    } catch (err) {
      console.error('빵집 데이터 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlace();
  }, [id]);

  /* 주소 클릭 → 네이버 지도 열기 */
  const openNaverMap = () => {
    if (!place) return;
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`, '_blank');
  };

  /* 로딩 중 */
  if (loading) {
    return (
      <div className="place-detail">
        <div className="pd-loading">
          <span className="pd-loading-icon">🍞</span>
          <p>빵집 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  /* 빵집 없음 */
  if (!place) {
    return (
      <div className="place-detail">
        <div className="pd-loading">
          <span style={{ fontSize: '3rem' }}>😢</span>
          <p>빵집 정보를 찾을 수 없습니다</p>
          <button className="pd-back-btn" onClick={() => navigate('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="place-detail">

      {/* ===== 1. 히어로 이미지 ===== */}
      <div className="pd-hero">
        <img
          src={place.images.length > 0 ? imgUrl(place.images[0].IMAGE_URL) : defaultHero}
          alt={place.name}
          className="pd-hero-img"
        />
        {/* 어두운 오버레이 (글씨 잘 보이게) */}
        <div className="pd-hero-overlay" />
        {/* 히어로 위에 빵집 이름 + 뱃지 표시 */}
        <div className="pd-hero-content">
          <div className="pd-hero-badges">
            {place.hasRibbon && <span className="pd-hero-badge ribbon">🎀 블루리본</span>}
            <span className="pd-hero-badge category">{place.category}</span>
          </div>
          <h1 className="pd-hero-name">{place.name}</h1>
          <div className="pd-hero-meta">
            <span className="pd-hero-rating">⭐ {place.rating}</span>
            <span className="pd-hero-dot">·</span>
            <span>리뷰 {place.reviewCount}개</span>
          </div>
        </div>
      </div>

      {/* ===== 2. 액션 바 (공유 + 좋아요 버튼) ===== */}
      <div className="pd-action-bar">
        <button
          className="pd-action-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              prompt('아래 링크를 복사해주세요:', window.location.href);
            }
          }}
        >
          <span className="pd-action-icon">{copied ? '✅' : '📤'}</span>
          <span>{copied ? '복사완료!' : '공유하기'}</span>
        </button>
        <button
          className={`pd-action-btn ${liked ? 'liked' : ''}`}
          onClick={() => {
            if (!currentUser) { alert('로그인이 필요합니다!'); return; }
            setLiked(!liked);
          }}
        >
          <span className="pd-action-icon">{liked ? '❤️' : '🤍'}</span>
          <span>{liked ? '좋아요!' : '좋아요'}</span>
        </button>
        <button className="pd-action-btn" onClick={openNaverMap}>
          <span className="pd-action-icon">📍</span>
          <span>지도보기</span>
        </button>
      </div>

      {/* ===== 3. 본문 영역 ===== */}
      <div className="pd-container">

        {/* --- 매장 정보 --- */}
        <div className="pd-section">
          <h2 className="pd-section-title">매장 정보</h2>
          <div className="pd-info-card">
            <div className="pd-info-row pd-info-clickable" onClick={openNaverMap}>
              <div className="pd-info-icon">📍</div>
              <div className="pd-info-text">
                <h4 className="pd-info-label">주소</h4>
                <p className="pd-info-value">{place.address}</p>
                <span className="pd-info-link-hint">네이버 지도에서 보기 →</span>
              </div>
            </div>
            <div className="pd-info-row">
              <div className="pd-info-icon">🕐</div>
              <div className="pd-info-text">
                <h4 className="pd-info-label">영업시간</h4>
                <p className="pd-info-value">매장에 직접 문의해주세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 매장 사진 갤러리 --- */}
        {place.images.length > 0 && (
          <div className="pd-section">
            <h2 className="pd-section-title">매장 사진 ({place.images.length})</h2>
            <div className="pd-gallery">
              {place.images.map((img, i) => (
                <div
                  key={i}
                  className="pd-gallery-item"
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={imgUrl(img.IMAGE_URL)} alt={`${place.name} ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 메뉴 --- */}
        <div className="pd-section">
          <h2 className="pd-section-title">메뉴</h2>
          {(!place.menus || place.menus.length === 0) ? (
            <div className="pd-empty-box">
              <span>🍞</span>
              <p>아직 등록된 메뉴 정보가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 시그니처 메뉴 (상위 3개) */}
              <div className="pd-sig-section">
                <p className="pd-sig-label">⭐ 시그니처 메뉴</p>
                <div className="pd-sig-list">
                  {place.menus.slice(0, 3).map((menu) => (
                    <div key={menu.MENU_NUM} className="pd-sig-card">
                      <div className="pd-sig-badge">BEST</div>
                      <div className="pd-sig-thumb">
                        {menu.IMAGE_URL
                          ? <img src={imgUrl(menu.IMAGE_URL)} alt={menu.MENU_NAME} className="pd-sig-thumb-img" />
                          : <span>🥐</span>}
                      </div>
                      <div className="pd-sig-info">
                        <span className="pd-sig-name">{menu.MENU_NAME}</span>
                        <span className="pd-sig-price">
                          {menu.PRICE > 0 ? menu.PRICE.toLocaleString() + '원' : '가격변동'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전체 메뉴 목록 (3개 초과 시) */}
              {place.menus.length > 3 && (
                <div className="pd-menu-rest">
                  <p className="pd-menu-rest-label">전체 메뉴</p>
                  <div className="pd-menu-grid">
                    {place.menus.slice(3).map((menu) => (
                      <div key={menu.MENU_NUM} className="pd-menu-card">
                        <div className="pd-menu-thumb">
                          {menu.IMAGE_URL
                            ? <img src={imgUrl(menu.IMAGE_URL)} alt={menu.MENU_NAME} className="pd-menu-thumb-img" />
                            : <span>🥐</span>}
                        </div>
                        <div className="pd-menu-info">
                          <span className="pd-menu-name">{menu.MENU_NAME}</span>
                          <span className="pd-menu-price">
                            {menu.PRICE > 0 ? menu.PRICE.toLocaleString() + '원' : '가격변동'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* --- 관련 코스 --- */}
        {place.courses && place.courses.length > 0 && (
          <div className="pd-section">
            <h2 className="pd-section-title">이 빵집이 포함된 코스</h2>
            <div className="pd-course-list">
              {place.courses.map((c) => (
                <div
                  key={c.COURSE_NUM}
                  className="pd-course-card"
                  onClick={() => navigate(`/courses/${c.COURSE_NUM}`)}
                >
                  <div className="pd-course-icon">🗺️</div>
                  <div className="pd-course-info">
                    <h4 className="pd-course-name">{c.TITLE}</h4>
                    <p className="pd-course-desc">{c.SUBTITLE || '빵지순례 코스'}</p>
                  </div>
                  <span className="pd-course-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 리뷰 --- */}
        <div className="pd-section">
          <div className="pd-section-header">
            <h2 className="pd-section-title">리뷰</h2>
            <button className="pd-review-write-btn" onClick={() => setShowReviewModal(true)}>
              ✏️ 리뷰 작성
            </button>
          </div>

          {/* 리뷰 요약 */}
          <div className="pd-review-summary">
            <div className="pd-review-big-score">
              <span className="pd-review-num">{place.rating}</span>
              <span className="pd-review-max">/ 5.0</span>
            </div>
            <div className="pd-review-stars-row">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`pd-star ${s <= Math.round(Number(place.rating)) ? 'filled' : ''}`}>★</span>
              ))}
            </div>
            <p className="pd-review-total">{place.reviewCount}개의 리뷰</p>
          </div>

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <div className="pd-empty-box">
              <span>💬</span>
              <p>아직 작성된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</p>
            </div>
          ) : (
            <div className="pd-review-list">
              {reviews.map((r) => (
                <div key={r.REVIEW_NUM} className="pd-review-card">
                  <div className="pd-review-author">
                    <div className="pd-review-avatar">{r.NICKNAME?.charAt(0) || '?'}</div>
                    <div>
                      <p className="pd-review-name">{r.NICKNAME}</p>
                      <div className="pd-review-meta">
                        <span className="pd-review-meta-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`pd-star-sm ${s <= r.RATING ? 'filled' : ''}`}>★</span>
                          ))}
                        </span>
                        <span className="pd-review-meta-date">
                          {new Date(r.CREATED_TIME).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="pd-review-text">{r.CONTENT}</p>
                  {currentUser && currentUser.userNum === r.USER_NUM && (
                    <button
                      className="pd-review-delete"
                      onClick={async () => {
                        if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
                        try {
                          await fetch(`${BASE_URL}/api/places/${id}/reviews/${r.REVIEW_NUM}`, { method: 'DELETE' });
                          fetchPlace();
                        } catch (err) { console.error('리뷰 삭제 실패:', err); }
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 사진 라이트박스 (크게 보기) ===== */}
      {lightboxIdx >= 0 && (
        <div className="pd-lightbox" onClick={() => setLightboxIdx(-1)}>
          <button className="pd-lightbox-close" onClick={() => setLightboxIdx(-1)}>✕</button>
          <img
            src={imgUrl(place.images[lightboxIdx].IMAGE_URL)}
            alt={`${place.name} ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          {/* 이전/다음 버튼 */}
          {lightboxIdx > 0 && (
            <button className="pd-lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>‹</button>
          )}
          {lightboxIdx < place.images.length - 1 && (
            <button className="pd-lightbox-next" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>›</button>
          )}
          <div className="pd-lightbox-count">{lightboxIdx + 1} / {place.images.length}</div>
        </div>
      )}

      {/* ===== 리뷰 작성 모달 ===== */}
      {showReviewModal && (
        <div className="pd-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h2 className="pd-modal-title">리뷰 작성</h2>
              <button className="pd-modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>

            <div className="pd-modal-rating">
              <p className="pd-modal-label">별점을 선택해주세요</p>
              <div className="pd-modal-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`pd-modal-star ${reviewRating >= star ? 'active' : ''}`}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <span className="pd-modal-rating-text">{reviewRating}점</span>
              )}
            </div>

            <div className="pd-modal-body">
              <p className="pd-modal-label">리뷰 내용</p>
              <textarea
                className="pd-modal-textarea"
                placeholder="이 빵집에 대한 솔직한 리뷰를 작성해주세요..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
              />
              <p className="pd-modal-charcount">{reviewText.length} / 500</p>
            </div>

            <div className="pd-modal-footer">
              <button className="pd-modal-cancel" onClick={() => setShowReviewModal(false)}>취소</button>
              <button
                className="pd-modal-submit"
                disabled={reviewRating === 0 || reviewText.trim() === ''}
                onClick={async () => {
                  if (!currentUser) { alert('로그인이 필요합니다!'); return; }
                  try {
                    const res = await fetch(`${BASE_URL}/api/places/${id}/reviews`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userNum: currentUser.userNum,
                        rating: reviewRating,
                        content: reviewText,
                      }),
                    });
                    if (!res.ok) throw new Error('리뷰 등록 실패');
                    alert('리뷰가 등록되었습니다!');
                    setShowReviewModal(false);
                    setReviewRating(0);
                    setReviewText('');
                    fetchPlace();
                  } catch (err) {
                    console.error('리뷰 등록 실패:', err);
                    alert('리뷰 등록에 실패했습니다.');
                  }
                }}
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
