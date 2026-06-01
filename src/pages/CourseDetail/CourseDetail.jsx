import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCourseDetail,
  toggleCourseLike,
  toggleCourseScrap,
  deleteCourse,
  getCourseComments,
  createCourseComment,
  deleteCourseComment,
  BASE_URL,
} from '../../api/apiAxios';
import './CourseDetail.css';

export default function CourseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [scrapCount, setScrapCount] = useState(0);
  const [lightbox, setLightbox] = useState(-1);
  const heroIndex = 0;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});

  const courseMapRef = useRef(null);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();

  const imgUrl = (url) => url?.startsWith('http') ? url : BASE_URL + url;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getCourseDetail(id, currentUser?.userNum);
        setCourse(data);
        const parsedPlaces = (data.places || []).map(p => ({
          ...p,
          images: typeof p.images === 'string' ? p.images.split(',').filter(Boolean) : (p.images || []),
        }));
        setPlaces(parsedPlaces);
        setLikeCount(data.likeCount || 0);
        setScrapCount(data.scrapCount || 0);
        setIsLiked(data.isLiked || false);
        setIsSaved(data.isScrapped || false);
      } catch (err) {
        console.error('코스 정보 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    try {
      const data = await getCourseComments(id);
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
  };

  const handleLike = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      const res = await toggleCourseLike(id, currentUser.userNum);
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err) { console.error('좋아요 실패:', err); }
  };

  const handleScrap = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      const res = await toggleCourseScrap(id, currentUser.userNum);
      setIsSaved(res.scraped);
      setScrapCount(prev => res.scraped ? prev + 1 : prev - 1);
    } catch (err) { console.error('스크랩 실패:', err); }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('정말 이 코스를 삭제할까요?')) return;
    try {
      await deleteCourse(id);
      alert('코스가 삭제되었습니다.');
      navigate('/course');
    } catch (err) { console.error('코스 삭제 실패:', err); }
  };

  const handleCommentSubmit = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    if (!newComment.trim()) return;
    try {
      await createCourseComment(id, currentUser.userNum, newComment);
      setNewComment('');
      fetchComments();
    } catch (err) { console.error('댓글 작성 실패:', err); }
  };

  const handleReplySubmit = async (parentNum) => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    if (!replyText.trim()) return;
    try {
      await createCourseComment(id, currentUser.userNum, replyText, parentNum);
      setReplyTo(null);
      setReplyText('');
      fetchComments();
    } catch (err) { console.error('답글 작성 실패:', err); }
  };

  const handleDeleteComment = async (commentNum) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteCourseComment(id, commentNum, currentUser.userNum);
      fetchComments();
    } catch (err) { console.error('댓글 삭제 실패:', err); }
  };

  const courseImages = (() => {
    if (!course?.COVER_IMAGES) return [];
    try {
      const parsed = JSON.parse(course.COVER_IMAGES);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(img => {
        if (typeof img === 'string') return { url: imgUrl(img), caption: '' };
        return { url: imgUrl(img.url), caption: img.caption || '' };
      });
    } catch { return []; }
  })();

  const galleryImages = (() => {
    const imgs = courseImages.map(ci => ci.url);
    if (imgs.length === 0 && course?.COVER_IMAGE) {
      imgs.push(imgUrl(course.COVER_IMAGE));
    }
    places.forEach(p => {
      if (p.images) p.images.forEach(img => imgs.push(imgUrl(img)));
    });
    return imgs;
  })();

  const heroImage = galleryImages.length > 0
    ? galleryImages[heroIndex]
    : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (places.length === 0 || !courseMapRef.current) return;
    if (!window.naver || !window.naver.maps) return;

    const map = new window.naver.maps.Map(courseMapRef.current, {
      zoom: 15,
      center: new window.naver.maps.LatLng(places[0].LATITUDE, places[0].LONGITUDE),
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT, style: window.naver.maps.ZoomControlStyle.SMALL },
    });

    const path = [];
    places.forEach((place, idx) => {
      const pos = new window.naver.maps.LatLng(place.LATITUDE, place.LONGITUDE);
      path.push(pos);
      const marker = new window.naver.maps.Marker({
        map, position: pos,
        icon: {
          content: `<div style="background:#c96442;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${idx + 1}</div>`,
          anchor: new window.naver.maps.Point(14, 14),
        },
      });
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `<div style="padding:10px;min-width:150px"><b>${place.PLACE_NAME}</b><br/><span style="font-size:12px;color:#666">${place.ADDRESS || ''}</span><br/><a href="https://map.kakao.com/link/to/${encodeURIComponent(place.PLACE_NAME)},${place.LATITUDE},${place.LONGITUDE}" target="_blank" style="display:inline-block;margin-top:6px;padding:4px 10px;background:#c96442;color:#fff;border-radius:4px;font-size:12px;text-decoration:none">길찾기</a></div>`,
        borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
      });
      window.naver.maps.Event.addListener(marker, 'click', () => infoWindow.open(map, marker));
    });

    if (path.length >= 2) {
      new window.naver.maps.Polyline({
        map, path, strokeColor: '#c96442', strokeWeight: 3, strokeOpacity: 0.8, strokeStyle: 'shortdash',
      });
    }

    if (places.length > 1) {
      const bounds = new window.naver.maps.LatLngBounds(
        new window.naver.maps.LatLng(Math.min(...places.map(p => p.LATITUDE)), Math.min(...places.map(p => p.LONGITUDE))),
        new window.naver.maps.LatLng(Math.max(...places.map(p => p.LATITUDE)), Math.max(...places.map(p => p.LONGITUDE)))
      );
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [places]);

  const parentComments = comments.filter(c => !c.PARENT_NUM);
  const getReplies = (parentNum) => comments.filter(c => c.PARENT_NUM === parentNum);
  const totalCommentCount = comments.length;

  if (loading) {
    return (
      <div className="course-detail">
        <div className="cd-loading">
          <span>🍞</span>
          <p>코스 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail">
        <div className="cd-loading">
          <span>😢</span>
          <p>코스를 찾을 수 없습니다.</p>
          <button className="cd-back-btn-main" onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail">

      {/* Back arrow above hero */}
      <button className="cd-back-arrow" onClick={() => navigate(-1)}>‹</button>

      {/* Hero */}
      <div className="cd-hero">
        <img src={heroImage} alt={course.TITLE} className="cd-hero-img"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900'; }}
        />
        <div className="cd-hero-overlay" />

        {/* Top-right: scrap + like */}
        <div className="cd-hero-actions">
          <button className={`cd-hero-icon-btn ${isSaved ? 'active' : ''}`} onClick={handleScrap}>
            {isSaved ? <i className="fi fi-sr-bookmark"></i> : <i className="fi fi-rr-bookmark"></i>}
          </button>
          <button className={`cd-hero-icon-btn cd-hero-heart ${isLiked ? 'active' : ''}`} onClick={handleLike}>
            {isLiked ? <i className="fi fi-ss-heart"></i> : <i className="fi fi-rs-heart"></i>}
            <span className="cd-hero-like-count">{likeCount > 999 ? (likeCount / 1000).toFixed(1) + 'K' : likeCount}</span>
          </button>
        </div>

        {/* Bottom: date + title + subtitle + tags */}
        <div className="cd-hero-content">
          <p className="cd-hero-date">{formatDate(course.CREATED_TIME)}</p>
          <h1 className="cd-hero-title">{course.TITLE}</h1>
          {course.SUBTITLE && <p className="cd-hero-subtitle">{course.SUBTITLE}</p>}
          {(() => {
            let tags = [];
            try {
              const t = course.TAGS;
              if (Array.isArray(t)) tags = t;
              else if (typeof t === 'string') tags = JSON.parse(t);
            } catch {}
            return tags.length > 0 ? (
              <div className="cd-hero-tags">
                {tags.map((tag, i) => (
                  <span key={i} className="cd-hero-tag">#{tag}</span>
                ))}
              </div>
            ) : null;
          })()}
        </div>

      </div>

      {/* Owner actions */}
      {currentUser && course.USER_NUM === currentUser.userNum && (
        <div className="cd-owner-actions">
          <button
            className="cd-owner-btn"
            onClick={() => {
              const coverImages = (() => {
                try {
                  const imgs = course.COVER_IMAGES;
                  if (Array.isArray(imgs)) return imgs;
                  if (typeof imgs === 'string') return JSON.parse(imgs);
                } catch {}
                return course.COVER_IMAGE ? [course.COVER_IMAGE] : [];
              })();
              navigate('/create', {
                state: {
                  courseNum: course.COURSE_NUM,
                  title: course.TITLE || '',
                  description: course.CONTENT || '',
                  tags: (() => {
                    try {
                      const t = course.TAGS;
                      if (Array.isArray(t)) return t;
                      if (typeof t === 'string') return JSON.parse(t);
                    } catch {}
                    return [];
                  })(),
                  places: places.map(p => ({
                    id: p.PLACE_NUM, name: p.PLACE_NAME, address: p.ADDRESS,
                    lat: parseFloat(p.LATITUDE), lng: parseFloat(p.LONGITUDE),
                  })),
                  placeComments: places.reduce((acc, p) => {
                    if (p.MEMO) acc[p.PLACE_NUM] = p.MEMO;
                    return acc;
                  }, {}),
                  coverImages,
                }
              });
            }}
          >
            ✏️ 수정
          </button>
          <button className="cd-owner-btn cd-owner-btn-danger" onClick={handleDeleteCourse}>
            🗑️ 삭제
          </button>
        </div>
      )}

      {/* Map + Place list */}
      {places.length > 0 && (
        <div className="cd-map-places">
          <div ref={courseMapRef} className="cd-map-container" />
          <div className="cd-place-list">
            {places.map((place, index) => (
              <div key={place.PLACE_NUM || index} className="cd-place-list-item">
                <span className="cd-place-num">{index + 1}</span>
                <div className="cd-place-list-thumb">
                  {place.images && place.images.length > 0 ? (
                    <img src={imgUrl(place.images[0])} alt={place.PLACE_NAME} />
                  ) : (
                    <span>🍞</span>
                  )}
                </div>
                <div className="cd-place-list-info">
                  <h4 className="cd-place-list-name" onClick={() => navigate(`/place/${place.PLACE_NUM}`)}>{place.PLACE_NAME}</h4>
                  <p className="cd-place-list-address">{place.ADDRESS}</p>
                  <p className="cd-place-list-memo">{place.MEMO || '이 장소에 대한 코멘트를 남겨주세요.'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="cd-comments-section">
        <h2 className="cd-comments-title">댓글 {totalCommentCount.toLocaleString()}개</h2>

        {/* Comment input */}
        <div className="cd-comment-input-row">
          <div className="cd-comment-avatar">
            {currentUser?.nickname?.charAt(0) || '?'}
          </div>
          <input
            type="text"
            className="cd-comment-input"
            placeholder="댓글 작성"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
          />
          <button className="cd-comment-cancel-btn" onClick={() => setNewComment('')}>취소</button>
          <button className="cd-comment-submit-btn" onClick={handleCommentSubmit}>작성완료</button>
        </div>

        {/* Comment list */}
        <div className="cd-comment-list">
          {parentComments.map((comment) => {
            const replies = getReplies(comment.COMMENT_NUM || comment.commentNum);
            const commentId = comment.COMMENT_NUM || comment.commentNum;
            const isExpanded = expandedReplies[commentId];

            return (
              <div key={commentId} className="cd-comment-group">
                <div className="cd-comment-item">
                  <div className="cd-comment-item-avatar">
                    {(comment.NICKNAME || comment.nickname || '?').charAt(0)}
                  </div>
                  <div className="cd-comment-item-body">
                    <p className="cd-comment-author">{comment.NICKNAME || comment.nickname || '익명'}</p>
                    <p className="cd-comment-text">{comment.CONTENT || comment.content}</p>
                    <div className="cd-comment-actions-row">
                      <button
                        className="cd-comment-reply-btn"
                        onClick={() => {
                          if (!currentUser) return alert('로그인이 필요합니다!');
                          setReplyTo(replyTo === commentId ? null : commentId);
                          setReplyText('');
                        }}
                      >
                        답글쓰기
                      </button>
                      {currentUser && (comment.USER_NUM || comment.userNum) === currentUser.userNum && (
                        <button className="cd-comment-delete-btn" onClick={() => handleDeleteComment(commentId)}>
                          삭제
                        </button>
                      )}
                    </div>
                    {replies.length > 0 && (
                      <button
                        className="cd-comment-expand-btn"
                        onClick={() => setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))}
                      >
                        ▾ 답글 {replies.length}개 보기
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply input */}
                {replyTo === commentId && (
                  <div className="cd-reply-input-row">
                    <div className="cd-comment-avatar cd-reply-avatar">
                      {currentUser?.nickname?.charAt(0) || '?'}
                    </div>
                    <input
                      type="text"
                      className="cd-comment-input cd-reply-input"
                      placeholder="답글 작성"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(commentId)}
                      autoFocus
                    />
                    <button className="cd-comment-cancel-btn" onClick={() => setReplyTo(null)}>취소</button>
                    <button className="cd-comment-submit-btn" onClick={() => handleReplySubmit(commentId)}>작성완료</button>
                  </div>
                )}

                {/* Replies */}
                {isExpanded && replies.map((reply) => {
                  const replyId = reply.COMMENT_NUM || reply.commentNum;
                  return (
                    <div key={replyId} className="cd-reply-item">
                      <div className="cd-comment-item-avatar cd-reply-avatar">
                        {(reply.NICKNAME || reply.nickname || '?').charAt(0)}
                      </div>
                      <div className="cd-comment-item-body">
                        <p className="cd-comment-author">{reply.NICKNAME || reply.nickname || '익명'}</p>
                        <p className="cd-comment-text">{reply.CONTENT || reply.content}</p>
                        {currentUser && (reply.USER_NUM || reply.userNum) === currentUser.userNum && (
                          <button className="cd-comment-delete-btn" onClick={() => handleDeleteComment(replyId)}>
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox >= 0 && (
        <div className="cd-lightbox" onClick={() => setLightbox(-1)}>
          <button className="cd-lightbox-close" onClick={() => setLightbox(-1)}>✕</button>
          <img src={galleryImages[lightbox]} alt={`코스 사진 ${lightbox + 1}`} className="cd-lightbox-img" onClick={(e) => e.stopPropagation()} />
          {lightbox > 0 && (
            <button className="cd-lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}>‹</button>
          )}
          {lightbox < galleryImages.length - 1 && (
            <button className="cd-lightbox-next" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}>›</button>
          )}
          <div className="cd-lightbox-count">{lightbox + 1} / {galleryImages.length}</div>
        </div>
      )}

    </div>
  );
}
