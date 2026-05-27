import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL, getPlaceGoogleDetails, getExternalPlaceDetails, saveExternalPlace, togglePlaceLike, togglePlaceBookmark, getPlaceStatus } from '../../api/apiAxios';
import './PlaceDetail.css';

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [googleInfo, setGoogleInfo] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;
  const [copied, setCopied] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const [activeTab, setActiveTab] = useState('홈');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!currentUser || !id || String(id).startsWith('ext_')) return;
    getPlaceStatus(id).then(data => {
      setIsLiked(data.liked);
      setIsBookmarked(data.bookmarked);
    }).catch(() => {});
  }, [id]);

  const defaultHero = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=400&fit=crop';
  const imgUrl = (url) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

  const getCourseImg = (course) => {
    const src = course.COVER_IMAGE || course.thumbnailImage;
    if (!src) return null;
    try {
      const parsed = JSON.parse(src);
      const first = Array.isArray(parsed) ? parsed[0] : src;
      return first?.startsWith('http') ? first : `${BASE_URL}${first}`;
    } catch {
      return src.startsWith('http') ? src : `${BASE_URL}${src}`;
    }
  };

  const getDistrict = (address) => {
    const match = address?.match(/([가-힣]+[구군시])\s/);
    return match ? match[1] : null;
  };

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
      const certification = data.categories && data.categories.length > 0
        ? data.categories[0].CERTIFICATION : '';

      setPlace({
        id: data.PLACE_NUM,
        name: data.PLACE_NAME,
        category: categoryName,
        address: data.ADDRESS || '주소 정보 없음',
        rating: data.avgRating ? Number(data.avgRating).toFixed(1) : '0.0',
        reviewCount: data.reviewCount || 0,
        lat: parseFloat(data.LATITUDE),
        lng: parseFloat(data.LONGITUDE),
        hasRibbon: certification?.includes('블루리본') || (ribbonCount && ribbonCount > 0),
        hasCheonha: certification?.includes('천하제빵'),
        hasMyungjang: certification?.includes('제과명장'),
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
    const isExternal = String(id).startsWith('ext_');

    if (isExternal) {
      const placeId = id.replace('ext_', '');
      setLoading(true);
      saveExternalPlace(placeId)
        .then(({ placeNum }) => {
          navigate(`/place/${placeNum}`, { replace: true });
        })
        .catch(() => {
          getExternalPlaceDetails(placeId)
            .then(data => {
              setPlace({
                id,
                name: data.name,
                address: data.address || '주소 정보 없음',
                rating: data.rating ? Number(data.rating).toFixed(1) : '0.0',
                reviewCount: data.ratingCount || 0,
                lat: data.lat, lng: data.lng,
                hasRibbon: false,
                images: data.photos.map(url => ({ IMAGE_URL: url })),
                courses: [], menus: [], isExternal: true,
              });
              setGoogleInfo({ found: true, openingHours: data.openingHours, isOpenNow: data.isOpenNow, phone: data.phone, website: data.website });
            })
            .catch(() => setPlace(null))
            .finally(() => setLoading(false));
        });
    } else {
      fetchPlace();
      getPlaceGoogleDetails(id)
        .then(data => { if (data?.found) setGoogleInfo(data); })
        .catch(() => {});
    }
  }, [id]);

  const openNaverMap = () => {
    if (!place) return;
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`, '_blank');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('아래 링크를 복사해주세요:', window.location.href);
    }
  };

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

  if (!place) {
    return (
      <div className="place-detail">
        <div className="pd-loading">
          <span style={{ fontSize: '3rem' }}>😢</span>
          <p>빵집 정보를 찾을 수 없습니다</p>
          <button className="pd-back-btn-main" onClick={() => navigate('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const district = getDistrict(place.address);
  const tabs = ['홈', '코스', '메뉴', '사진', '정보'];

  return (
    <div className="place-detail">

      {/* Back arrow */}
      <button className="pd-back-arrow" onClick={() => navigate(-1)}>‹</button>

      {/* Horizontal scrolling image gallery */}
      <div className="pd-gallery-scroll">
        {place.images.length > 0 ? (
          place.images.map((img, i) => (
            <div key={i} className="pd-gallery-scroll-item" onClick={() => setLightboxIdx(i)}>
              <img src={imgUrl(img.IMAGE_URL)} alt={`${place.name} ${i + 1}`} />
            </div>
          ))
        ) : (
          <div className="pd-gallery-scroll-item">
            <img src={defaultHero} alt={place.name} />
          </div>
        )}
      </div>

      {/* Store info section */}
      <div className="pd-store-info">
        <div className="pd-store-header">
          <h1 className="pd-store-name">{place.name}</h1>
          <div className="pd-store-actions">
            <button className="pd-icon-btn" onClick={handleShare} title="공유하기">
              {copied ? <span className="pd-icon-check">✓</span> : <i className="fi fi-rs-share"></i>}
            </button>
            <button
              className={`pd-icon-btn ${isBookmarked ? 'active' : ''}`}
              title="북마크"
              onClick={async () => {
                if (!currentUser) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
                try {
                  const res = await togglePlaceBookmark(place.id);
                  setIsBookmarked(res.bookmarked);
                } catch { setIsBookmarked(prev => !prev); }
              }}
            >
              <i className={isBookmarked ? 'fi fi-ss-bookmark' : 'fi fi-rs-bookmark'}></i>
            </button>
            <button
              className={`pd-icon-btn pd-icon-btn-heart ${isLiked ? 'active' : ''}`}
              title="좋아요"
              onClick={async () => {
                if (!currentUser) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
                try {
                  const res = await togglePlaceLike(place.id);
                  setIsLiked(res.liked);
                } catch { setIsLiked(prev => !prev); }
              }}
            >
              <i className={isLiked ? 'fi fi-ss-heart' : 'fi fi-rs-heart'}></i>
            </button>
          </div>
        </div>
        <p className="pd-store-address">{place.address}</p>
        <div className="pd-store-rating">
          <span className="pd-store-star">★</span> {place.rating}
        </div>
        <div className="pd-store-tags">
          {place.hasCheonha && <span className="pd-tag">#천하제빵</span>}
          {place.hasRibbon && <span className="pd-tag">#블루리본</span>}
          {place.hasMyungjang && <span className="pd-tag">#제과명장</span>}
          <span className="pd-tag">#{place.category}</span>
          {district && <span className="pd-tag">#{district}</span>}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="pd-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pd-tab-content">

        {/* ===== 홈 탭 ===== */}
        {activeTab === '홈' && (
          <>
            {place.courses && place.courses.length > 0 && (
              <section className="pd-section">
                <h2 className="pd-section-title">포함하고 있는 코스들</h2>
                <div className="pd-home-courses">
                  {place.courses.map(c => {
                    const courseImg = getCourseImg(c);
                    return (
                      <div key={c.COURSE_NUM} className="pd-home-course-card" onClick={() => navigate(`/courses/${c.COURSE_NUM}`)}>
                        <div className="pd-home-course-img">
                          {courseImg ? (
                            <img src={courseImg} alt={c.TITLE} />
                          ) : (
                            <div className="pd-home-course-placeholder">🗺️</div>
                          )}
                        </div>
                        <h4 className="pd-home-course-title">{c.TITLE}</h4>
                        <p className="pd-home-course-subtitle">{c.SUBTITLE || '오늘의 빵지순례에 시작하기'}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {place.menus && place.menus.length > 0 && (
              <section className="pd-section">
                <h2 className="pd-section-title">시그니처 메뉴</h2>
                <div className="pd-home-menus">
                  {place.menus.slice(0, 3).map((menu, idx) => (
                    <div key={menu.MENU_NUM} className="pd-home-menu-card">
                      <div className="pd-home-menu-img">
                        {menu.IMAGE_URL ? (
                          <img src={imgUrl(menu.IMAGE_URL)} alt={menu.MENU_NAME} />
                        ) : (
                          <div className="pd-home-menu-placeholder">🥐</div>
                        )}
                      </div>
                      {idx < 2 && <span className="pd-menu-badge">대표</span>}
                      <p className="pd-home-menu-name">{menu.MENU_NAME}</p>
                      <p className="pd-home-menu-price">
                        {menu.PRICE > 0 ? menu.PRICE.toLocaleString() + ' 원' : '가격변동'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 리뷰 섹션 */}
            <section className="pd-section">
              <div className="pd-section-header">
                <h2 className="pd-section-title">리뷰</h2>
                {!place.isExternal && (
                  <button className="pd-review-write-btn" onClick={() => {
                    const user = localStorage.getItem('user');
                    if (!user) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
                    setShowReviewModal(true);
                  }}>
                    ✏️ 리뷰 작성
                  </button>
                )}
              </div>

              {place.isExternal ? (
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
                  <p className="pd-review-total">Google 리뷰 {place.reviewCount}개</p>
                  <div className="pd-empty-box" style={{ marginTop: '1rem' }}>
                    <span>🌐</span>
                    <p>오븐로드에 등록되지 않은 빵집이에요.<br />리뷰는 Google 지도에서 확인하세요.</p>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`}
                      target="_blank" rel="noreferrer"
                      className="pd-ext-link"
                    >
                      Google 지도에서 보기 →
                    </a>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </section>
          </>
        )}

        {/* ===== 코스 탭 ===== */}
        {activeTab === '코스' && (
          <section className="pd-section">
            {place.courses && place.courses.length > 0 ? (
              <div className="pd-course-grid">
                {place.courses.map(c => {
                  const courseImg = getCourseImg(c);
                  return (
                    <div key={c.COURSE_NUM} className="pd-course-card-new" onClick={() => navigate(`/courses/${c.COURSE_NUM}`)}>
                      <div className="pd-course-card-img">
                        {courseImg ? (
                          <img src={courseImg} alt={c.TITLE} />
                        ) : (
                          <div className="pd-course-placeholder">🗺️</div>
                        )}
                      </div>
                      <h4 className="pd-course-card-title">{c.TITLE}</h4>
                      <p className="pd-course-card-subtitle">{c.SUBTITLE || '오늘의 빵지순례에 시작하기'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pd-empty-box">
                <span>🗺️</span>
                <p>아직 이 빵집이 포함된 코스가 없습니다</p>
              </div>
            )}
          </section>
        )}

        {/* ===== 메뉴 탭 ===== */}
        {activeTab === '메뉴' && (
          <section className="pd-section">
            {place.menus && place.menus.length > 0 ? (
              <div className="pd-menu-grid-new">
                {place.menus.map((menu, idx) => (
                  <div key={menu.MENU_NUM} className="pd-menu-card-new">
                    <div className="pd-menu-card-img">
                      {menu.IMAGE_URL ? (
                        <img src={imgUrl(menu.IMAGE_URL)} alt={menu.MENU_NAME} />
                      ) : (
                        <div className="pd-menu-placeholder">🥐</div>
                      )}
                    </div>
                    {idx < 2 && <span className="pd-menu-badge">대표</span>}
                    <p className="pd-menu-card-name">{menu.MENU_NAME}</p>
                    <p className="pd-menu-card-price">
                      {menu.PRICE > 0 ? menu.PRICE.toLocaleString() + ' 원' : '가격변동'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pd-empty-box">
                <span>🍞</span>
                <p>아직 등록된 메뉴 정보가 없습니다</p>
                <a
                  className="pd-naver-menu-fallback"
                  href={`https://map.naver.com/v5/search/${encodeURIComponent((place.name || '') + ' ' + (place.address || ''))}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  네이버 플레이스에서 메뉴 확인하기 →
                </a>
              </div>
            )}
          </section>
        )}

        {/* ===== 사진 탭 ===== */}
        {activeTab === '사진' && (
          <section className="pd-section">
            {place.images.length > 0 ? (
              <div className="pd-photo-grid">
                {place.images.map((img, i) => (
                  <div key={i} className="pd-photo-item" onClick={() => setLightboxIdx(i)}>
                    <img src={imgUrl(img.IMAGE_URL)} alt={`${place.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pd-empty-box">
                <span>📷</span>
                <p>등록된 사진이 없습니다</p>
              </div>
            )}
          </section>
        )}

        {/* ===== 정보 탭 ===== */}
        {activeTab === '정보' && (
          <section className="pd-section">
            <div className="pd-info-card-new">
              <div className="pd-info-grid-new">
                {googleInfo?.isOpenNow === true && <div className="pd-info-item-new">• 영업 중</div>}
                {googleInfo?.isOpenNow === false && <div className="pd-info-item-new">• 영업 종료</div>}
                {googleInfo?.openingHours && googleInfo.openingHours.length > 0 && (
                  <div className="pd-info-item-new">• 영업 시간 : {googleInfo.openingHours[0]?.replace(/^[가-힣]+:\s*/, '')}</div>
                )}
                {googleInfo?.phone && (
                  <div className="pd-info-item-new">• 가게번호 : <a href={`tel:${googleInfo.phone}`}>{googleInfo.phone}</a></div>
                )}
                <div className="pd-info-item-new pd-info-clickable" onClick={openNaverMap}>• 주소 : {place.address}</div>
                {googleInfo?.website && (
                  <div className="pd-info-item-new">• 웹사이트 : <a href={googleInfo.website} target="_blank" rel="noreferrer">
                    {googleInfo.website.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 30)}
                  </a></div>
                )}
              </div>
              {googleInfo?.openingHours && googleInfo.openingHours.length > 1 && (
                <div className="pd-info-hours-detail">
                  <p className="pd-info-hours-title">전체 영업시간</p>
                  <ul className="pd-info-hours-list">
                    {googleInfo.openingHours.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx >= 0 && (
        <div className="pd-lightbox" onClick={() => setLightboxIdx(-1)}>
          <button className="pd-lightbox-close" onClick={() => setLightboxIdx(-1)}>✕</button>
          <img
            src={imgUrl(place.images[lightboxIdx].IMAGE_URL)}
            alt={`${place.name} ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIdx > 0 && (
            <button className="pd-lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>‹</button>
          )}
          {lightboxIdx < place.images.length - 1 && (
            <button className="pd-lightbox-next" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>›</button>
          )}
          <div className="pd-lightbox-count">{lightboxIdx + 1} / {place.images.length}</div>
        </div>
      )}

      {/* Review modal */}
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
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${BASE_URL}/api/places/${id}/reviews`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
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
