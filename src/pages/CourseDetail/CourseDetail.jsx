/* ===================================================
   CourseDetail 컴포넌트 (코스 상세 페이지)
   - 코스를 클릭하면 나오는 상세 페이지야!
   - 백엔드 API에서 진짜 데이터를 받아와서 보여줘
   - 구성: 히어로 이미지 → 액션바(좋아요/스크랩) → 코스 소개
          → 장소 타임라인 → 이미지 갤러리 → 댓글(답글) → 하단바
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCourseDetail,
  toggleCourseLike,
  toggleCourseScrap,
  getCourseComments,
  createCourseComment,
  deleteCourseComment,
  deleteCourse,
  BASE_URL,
} from '../../api/apiAxios';
import './CourseDetail.css';

export default function CourseDetail() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 쓰는 도구 */
  const navigate = useNavigate();

  /* --- URL에서 코스 번호 꺼내기 --- */
  /* /course/3 이면 id = '3' 이 됨! */
  const { id } = useParams();

  /* --- 상태(state) 관리 --- */
  /* course: 서버에서 받아온 코스 정보 (제목, 내용, 작성자 등) */
  const [course, setCourse] = useState(null);
  /* places: 코스에 포함된 장소 목록 (빵집들!) */
  const [places, setPlaces] = useState([]);
  /* loading: 데이터 불러오는 중인지 표시 */
  const [loading, setLoading] = useState(true);
  /* isLiked: 좋아요 눌렀는지 */
  const [isLiked, setIsLiked] = useState(false);
  /* isSaved: 스크랩(저장) 눌렀는지 */
  const [isSaved, setIsSaved] = useState(false);
  /* likeCount: 좋아요 개수 */
  const [likeCount, setLikeCount] = useState(0);
  /* scrapCount: 스크랩 개수 */
  const [scrapCount, setScrapCount] = useState(0);
  /* comments: 댓글 목록 */
  const [comments, setComments] = useState([]);
  /* commentText: 댓글 입력창에 적은 글 */
  const [commentText, setCommentText] = useState('');
  /* replyTo: 지금 답글 쓰고 있는 댓글 번호 (null이면 안 쓰는 중) */
  const [replyTo, setReplyTo] = useState(null);
  /* replyText: 답글 입력창에 적은 글 */
  const [replyText, setReplyText] = useState('');
  /* lightbox: 이미지 크게 보기 인덱스 (-1이면 안 보임) */
  const [lightbox, setLightbox] = useState(-1);

  /* --- 현재 로그인한 사용자 정보 가져오기 --- */
  /* localStorage에 저장해둔 유저 정보를 꺼냄 */
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  /* --- 이미지 URL 만들어주는 도우미 함수 --- */
  /* 서버 이미지 경로가 /uploads/... 이런 식이면 앞에 서버 주소를 붙여줌 */
  const imgUrl = (url) =>
    url?.startsWith('http') ? url : BASE_URL + url;

  /* --- 댓글 목록 가져오기 --- */
  /* 서버에서 이 코스의 댓글들을 불러오는 함수 */
  const fetchComments = async () => {
    try {
      const data = await getCourseComments(id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
    }
  };

  /* --- 페이지 처음 열릴 때 데이터 불러오기 --- */
  /* id가 바뀔 때마다 코스 정보 + 댓글을 새로 가져옴 */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        /* 코스 상세 정보 가져오기 */
        const data = await getCourseDetail(id);
        setCourse(data);
        /* 장소의 images가 문자열이면 배열로 변환 (쉼표로 나뉜 URL) */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* --- 좋아요 버튼 클릭 --- */
  /* 서버에 좋아요 토글 요청을 보내고 결과를 반영 */
  const handleLike = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      const res = await toggleCourseLike(id, currentUser.userNum);
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  /* --- 스크랩 버튼 클릭 --- */
  /* 서버에 스크랩 토글 요청을 보내고 결과를 반영 */
  const handleScrap = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      const res = await toggleCourseScrap(id, currentUser.userNum);
      setIsSaved(res.scrapped);
      setScrapCount(res.scrapCount);
    } catch (err) {
      console.error('스크랩 실패:', err);
    }
  };

  /* --- 댓글 등록 --- */
  /* 입력한 텍스트를 서버에 보내서 댓글을 등록 */
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      await createCourseComment(id, currentUser.userNum, commentText);
      setCommentText('');
      fetchComments();
    } catch (err) {
      console.error('댓글 등록 실패:', err);
    }
  };

  /* --- 답글 등록 --- */
  /* 특정 댓글에 대한 답글을 서버에 보내서 등록 */
  const handleReplySubmit = async (parentNum) => {
    if (!replyText.trim()) return;
    if (!currentUser) return alert('로그인이 필요합니다!');
    try {
      await createCourseComment(id, currentUser.userNum, replyText, parentNum);
      setReplyTo(null);
      setReplyText('');
      fetchComments();
    } catch (err) {
      console.error('답글 등록 실패:', err);
    }
  };

  /* --- 댓글 삭제 --- */
  /* 내가 쓴 댓글을 삭제 */
  const handleDeleteComment = async (commentNum) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await deleteCourseComment(id, commentNum, currentUser.userNum);
      fetchComments();
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
    }
  };

  /* --- 코스 삭제 --- */
  /* 내가 만든 코스를 삭제 */
  const handleDeleteCourse = async () => {
    if (!window.confirm('정말 이 코스를 삭제할까요?')) return;
    try {
      await deleteCourse(id);
      alert('코스가 삭제되었습니다.');
      navigate('/course');
    } catch (err) {
      console.error('코스 삭제 실패:', err);
    }
  };

  /* --- 히어로 이미지 결정 --- */
  /* 코스 커버 이미지가 있으면 그걸 쓰고, 없으면 첫 번째 장소 이미지, 그것도 없으면 기본 이미지 */
  const heroImage = course?.COVER_IMAGE
    ? imgUrl(course.COVER_IMAGE)
    : places.length > 0 && places[0].images && places[0].images.length > 0
      ? imgUrl(places[0].images[0])
      : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900';

  /* --- 이미지 갤러리 만들기 --- */
  /* 커버 이미지 + 장소 이미지들을 모아서 최대 6개까지 보여줌 */
  const galleryImages = (() => {
    const imgs = [];
    if (course?.COVER_IMAGE) imgs.push(imgUrl(course.COVER_IMAGE));
    places.forEach((p) => {
      if (p.images) p.images.forEach((img) => imgs.push(imgUrl(img)));
    });
    return imgs.slice(0, 6);
  })();

  /* --- 날짜를 예쁘게 바꿔주는 함수 --- */
  /* '2025-12-15T09:00:00' → '2025.12.15' */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  /* --- "코스 탐방하기" 버튼 클릭 --- */
  /* 네이버 지도에서 장소들을 경유하는 길찾기를 열어줌 */
  const openNaverDirections = () => {
    if (places.length === 0) return;
    /* 출발지: 첫 번째 장소 */
    const start = places[0];
    /* 도착지: 마지막 장소 */
    const end = places[places.length - 1];
    /* 경유지: 중간 장소들 */
    const waypoints = places.slice(1, -1);

    let url = `https://map.naver.com/v5/directions/`;
    url += `${start.LONGITUDE},${start.LATITUDE},${encodeURIComponent(start.PLACE_NAME)}/`;
    if (waypoints.length > 0) {
      waypoints.forEach((wp) => {
        url += `${wp.LONGITUDE},${wp.LATITUDE},${encodeURIComponent(wp.PLACE_NAME)}/`;
      });
    }
    url += `${end.LONGITUDE},${end.LATITUDE},${encodeURIComponent(end.PLACE_NAME)}`;
    url += '/-/walk';

    window.open(url, '_blank');
  };

  /* --- 댓글을 부모-자식 구조로 묶기 --- */
  /* 서버에서 댓글이 flat하게 오면, 부모 댓글 아래에 답글을 넣어줌 */
  const organizeComments = (rawComments) => {
    /* 부모가 없는 댓글(최상위 댓글) 찾기 */
    const topLevel = rawComments.filter((c) => !c.PARENT_NUM);
    /* 각 최상위 댓글에 답글 붙이기 */
    return topLevel.map((parent) => ({
      ...parent,
      replies: rawComments.filter((c) => c.PARENT_NUM === parent.COMMENT_NUM),
    }));
  };

  /* 정리된 댓글 목록 */
  const organizedComments = organizeComments(comments);

  /* --- 로딩 중이면 로딩 화면 표시 --- */
  if (loading) {
    return (
      <div className="course-detail" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p>코스 정보를 불러오는 중...</p>
      </div>
    );
  }

  /* --- 코스 정보가 없으면 에러 화면 --- */
  if (!course) {
    return (
      <div className="course-detail" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p>코스를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className="course-detail">

      {/* ===== 1. 히어로 이미지 ===== */}
      {/* 코스의 대표 이미지가 크게 보이는 영역 */}
      <div className="cd-hero">
        <img
          src={heroImage}
          alt={course.TITLE}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* ← 뒤로가기 버튼 */}
        <button className="cd-back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>

      {/* ===== 2~6: 메인 콘텐츠 영역 ===== */}
      <div className="cd-content">

        {/* ===== 2. 코스 정보 ===== */}
        <section className="cd-info">
          {/* 날짜 */}
          <p className="cd-info-meta">
            📍 {formatDate(course.CREATED_TIME)}
          </p>
          {/* 코스 제목 */}
          <h1 className="cd-info-title">{course.TITLE}</h1>
          {/* 부제목이 있으면 표시 */}
          {course.SUBTITLE && (
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              {course.SUBTITLE}
            </p>
          )}
          {/* 작성자 */}
          <div className="cd-info-author">
            <div className="cd-author-avatar" />
            <span>{course.NICKNAME || '작성자'}</span>
          </div>

          {/* 태그 칩들: 장소 수 */}
          <div className="cd-info-chips">
            <span className="cd-chip">📍 {places.length}곳</span>
          </div>

          {/* 좋아요 + 저장 + 삭제 버튼 */}
          <div className="cd-info-actions">
            <button
              className={`cd-action-btn ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
            >
              {isLiked ? '❤️' : '♡'} 좋아요
            </button>
            <button
              className={`cd-action-btn ${isSaved ? 'active' : ''}`}
              onClick={handleScrap}
            >
              {isSaved ? '🔖' : '☆'} 저장
            </button>
            {/* 내가 만든 코스면 삭제 버튼도 보여줌 */}
            {currentUser && course.USER_NUM === currentUser.userNum && (
              <button
                className="cd-action-btn"
                onClick={handleDeleteCourse}
                style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        </section>

        {/* ===== 3. 코스 장소 목록 (타임라인 스타일) ===== */}
        {/* 번호가 적힌 동그라미와 세로선으로 연결된 장소 카드들 */}
        <section className="cd-places">
          <h2 className="cd-section-title">코스 장소 ({places.length}곳)</h2>

          {places.map((place, index) => (
            <div key={place.PLACE_NUM || index} className="cd-place-item">
              {/* 순서 번호 (원형 뱃지) */}
              <div className="cd-place-num">{index + 1}</div>
              {/* 장소 이미지 */}
              <div className="cd-place-img">
                {place.images && place.images.length > 0 ? (
                  <img
                    src={imgUrl(place.images[0])}
                    alt={place.PLACE_NAME}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />
                ) : (
                  <span>🍞</span>
                )}
              </div>
              {/* 장소 정보 */}
              <div className="cd-place-info">
                <h3 className="cd-place-name" onClick={() => navigate(`/place/${place.PLACE_NUM}`)} style={{ cursor: 'pointer' }}>{place.PLACE_NAME}</h3>
                <p className="cd-place-address">{place.ADDRESS}</p>
                {/* 메모가 있으면 표시 */}
                {place.MEMO && (
                  <p className="cd-place-signature">메모: {place.MEMO}</p>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ===== 4. 코스 소개 ===== */}
        {/* 코스에 대한 설명글 */}
        {course.CONTENT && (
          <section className="cd-description">
            <h2 className="cd-section-title">코스 소개</h2>
            <p className="cd-description-text">{course.CONTENT}</p>
          </section>
        )}

        {/* ===== 5. 이미지 갤러리 ===== */}
        {/* 코스 커버 이미지 + 장소 이미지들을 최대 6개까지 보여줌 */}
        {galleryImages.length > 0 && (
          <section style={{ padding: '28px 0', borderBottom: '1px solid #f0f0f0' }}>
            <h2 className="cd-section-title">사진 ({galleryImages.length})</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {galleryImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`코스 사진 ${i + 1}`}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setLightbox(i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ===== 6. 댓글 ===== */}
        {/* 댓글을 쓰고, 읽고, 답글도 달 수 있는 영역 */}
        <section className="cd-comments">
          <h2 className="cd-section-title">댓글 ({comments.length})</h2>

          {/* --- 댓글 입력 영역 --- */}
          <div className="cd-comment-input-wrap">
            <div className="cd-comment-avatar">
              {currentUser?.nickname?.[0] || '나'}
            </div>
            <div className="cd-comment-input-box">
              <textarea
                className="cd-comment-input"
                placeholder="댓글을 남겨보세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                /* Enter 키로 댓글 등록 (Shift+Enter는 줄바꿈) */
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
              <div className="cd-comment-input-actions">
                <button className="cd-comment-submit-btn" onClick={handleCommentSubmit}>
                  등록
                </button>
              </div>
            </div>
          </div>

          {/* --- 댓글 목록 --- */}
          {organizedComments.map((comment) => (
            <div key={comment.COMMENT_NUM} className="cd-comment-group">

              {/* 댓글 본체 */}
              <div className="cd-comment-item">
                {/* 댓글 작성자 아바타 */}
                <div className="cd-comment-item-avatar">
                  {comment.NICKNAME?.[0] || '?'}
                </div>
                {/* 댓글 내용 */}
                <div className="cd-comment-item-body">
                  <div className="cd-comment-item-header">
                    <span className="cd-comment-author">{comment.NICKNAME}</span>
                    <span className="cd-comment-date">{formatDate(comment.CREATED_TIME)}</span>
                  </div>
                  <p className="cd-comment-text">{comment.CONTENT}</p>
                  {/* 답글 버튼 + 삭제 버튼 */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className={`cd-comment-reply-btn ${replyTo === comment.COMMENT_NUM ? 'active' : ''}`}
                      onClick={() => {
                        if (replyTo === comment.COMMENT_NUM) {
                          setReplyTo(null);
                          setReplyText('');
                        } else {
                          setReplyTo(comment.COMMENT_NUM);
                          setReplyText('');
                        }
                      }}
                    >
                      💬 답글
                    </button>
                    {/* 내가 쓴 댓글이면 삭제 버튼 표시 */}
                    {currentUser && comment.USER_NUM === currentUser.userNum && (
                      <button
                        className="cd-comment-reply-btn"
                        onClick={() => handleDeleteComment(comment.COMMENT_NUM)}
                        style={{ color: '#e74c3c' }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* --- 답글 목록 --- */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="cd-reply-list">
                  {comment.replies.map((reply) => (
                    <div key={reply.COMMENT_NUM} className="cd-reply-item">
                      {/* 답글 작성자 아바타 */}
                      <div className="cd-comment-item-avatar">
                        {reply.NICKNAME?.[0] || '?'}
                      </div>
                      {/* 답글 내용 */}
                      <div className="cd-comment-item-body">
                        <div className="cd-comment-item-header">
                          <span className="cd-comment-author">{reply.NICKNAME}</span>
                          <span className="cd-comment-date">{formatDate(reply.CREATED_TIME)}</span>
                        </div>
                        <p className="cd-comment-text">{reply.CONTENT}</p>
                        {/* 내가 쓴 답글이면 삭제 버튼 표시 */}
                        {currentUser && reply.USER_NUM === currentUser.userNum && (
                          <button
                            className="cd-comment-reply-btn"
                            onClick={() => handleDeleteComment(reply.COMMENT_NUM)}
                            style={{ color: '#e74c3c' }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- 답글 입력창 (해당 댓글의 답글 버튼 클릭 시 표시) --- */}
              {replyTo === comment.COMMENT_NUM && (
                <div className="cd-reply-input-wrap">
                  <div className="cd-comment-avatar">
                    {currentUser?.nickname?.[0] || '나'}
                  </div>
                  <div className="cd-comment-input-box">
                    <textarea
                      className="cd-comment-input cd-reply-input"
                      placeholder={`${comment.NICKNAME}님에게 답글 작성...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      /* Enter 키로 답글 등록 */
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(comment.COMMENT_NUM);
                        }
                      }}
                      autoFocus
                    />
                    <div className="cd-comment-input-actions">
                      {/* 취소 버튼 */}
                      <button
                        className="cd-reply-cancel-btn"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText('');
                        }}
                      >
                        취소
                      </button>
                      {/* 등록 버튼 */}
                      <button
                        className="cd-comment-submit-btn"
                        onClick={() => handleReplySubmit(comment.COMMENT_NUM)}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

      </div>

      {/* ===== 7. 하단 고정바 ===== */}
      {/* 스크롤해도 항상 화면 아래에 보이는 바 */}
      <div className="cd-bottom-bar">
        <div className="cd-bottom-stats">
          <span>♡ {likeCount}</span>
          <span>🔖 {scrapCount}</span>
        </div>
        <button className="cd-bottom-cta" onClick={openNaverDirections}>
          코스 탐방하기
        </button>
      </div>

      {/* ===== 8. 라이트박스 (이미지 크게 보기 + 좌우 넘기기) ===== */}
      {lightbox >= 0 && (
        <div className="cd-lightbox" onClick={() => setLightbox(-1)}>
          {/* 닫기 버튼 */}
          <button className="cd-lightbox-close" onClick={() => setLightbox(-1)}>✕</button>
          {/* 현재 이미지 */}
          <img
            src={galleryImages[lightbox]}
            alt={`코스 사진 ${lightbox + 1}`}
            className="cd-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          {/* ← 이전 버튼 */}
          {lightbox > 0 && (
            <button className="cd-lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}>‹</button>
          )}
          {/* → 다음 버튼 */}
          {lightbox < galleryImages.length - 1 && (
            <button className="cd-lightbox-next" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}>›</button>
          )}
          {/* 현재 번호 / 전체 */}
          <div className="cd-lightbox-count">{lightbox + 1} / {galleryImages.length}</div>
        </div>
      )}

    </div>
  );
}
