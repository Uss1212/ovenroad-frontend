/* ===================================================
   CourseDetail 컴포넌트 (코스 상세 페이지)
   - 추천 코스를 클릭하면 나오는 상세 페이지
   - 구성: 히어로 이미지 → 코스 정보 → 코스 지도 → 장소 목록
          → 코스 소개 → 댓글(답글 포함) → 하단 고정바
   - 나중에 백엔드 API에서 코스 데이터를 받아올 예정
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseDetail.css';

export default function CourseDetail() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  /* 좋아요 눌렀는지 */
  const [isLiked, setIsLiked] = useState(false);
  /* 저장(스크랩) 눌렀는지 */
  const [isSaved, setIsSaved] = useState(false);
  /* 댓글 입력값 */
  const [commentText, setCommentText] = useState('');
  /* 댓글 목록 (등록하면 여기에 추가됨) */
  const [commentList, setCommentList] = useState([
    {
      id: 1,
      author: '달콤이',
      initial: '달',
      date: '2025.12.20',
      text: '이 코스 따라 다녀왔는데 바로 소금빵이 진짜 미쳤어요!!',
      /* 답글 목록: 각 댓글에 답글이 달릴 수 있음 */
      replies: [
        {
          id: 101,
          author: '빵순이기',
          initial: '빵',
          date: '2025.12.21',
          text: '감사합니다! 소금빵 진짜 추천이에요 ㅎㅎ',
        },
      ],
    },
    {
      id: 2,
      author: '빵순이이',
      initial: '순',
      date: '2025.12.18',
      text: '카페 레이어드 당근케이크 진짜 맛있었어요. 근데 주말엔 웨이팅 각오하세요 ㅋ',
      replies: [],
    },
    {
      id: 3,
      author: '을지로러버',
      initial: '을',
      date: '2025.12.16',
      text: '세컨드 브레드 비건빵 추천합니다! 건강하면서도 맛있어요. 코스 감사합니다~',
      replies: [],
    },
  ]);
  /* 현재 답글을 작성 중인 댓글 ID (null이면 답글 입력 안 보임) */
  const [replyingTo, setReplyingTo] = useState(null);
  /* 답글 입력값 */
  const [replyText, setReplyText] = useState('');

  /* --- 코스 더미 데이터 --- */
  /* 나중에 백엔드 COURSES 테이블에서 받아올 데이터 */
  const course = {
    title: '을지로 숨은 빵집 탐방 코스',
    location: '서울 중구 을지로',
    date: '2025.12.15',
    author: '빵순이기',
    duration: '약 3시간',
    distance: '도보 2.4km',
    placeCount: 5,
    likes: 892,
    saves: 234,
    description: '을지로 골목 사이 숨겨진 보석 같은 빵집 5곳을 돌아보는 반나절 코스에요. 오래된 골목 사이로 풍기는 빵 냄새를 따라가다 보면, 서울에서 가장 힙한 빵집투어를 경험할 수 있어요. 각 빵집마다 시그니처 메뉴를 꼭 먹어봐야 해요!',
  };

  /* --- 장소 더미 데이터 --- */
  /* 나중에 백엔드 COURSE_PLACE + PLACES 테이블에서 받아올 데이터 */
  const places = [
    { id: 1, name: '바로', address: '서울 중구 을지로 33', rating: 4.8, reviews: 320, signature: '소금빵, 밤앙빵' },
    { id: 2, name: '오월의 종', address: '서울 중구 을지로3가 188', rating: 4.6, reviews: 215, signature: '크루아상, 아메리카노' },
    { id: 3, name: '카페 레이어드', address: '서울 중구 을지로 170', rating: 4.5, reviews: 489, signature: '당근케이크, 라떼' },
    { id: 4, name: '세컨드 브레드', address: '서울 중구 을지로 128-1', rating: 4.7, reviews: 178, signature: '우리밀빵, 비건브레드' },
    { id: 5, name: '을지면장 옛빵집', address: '서울 중구 을지로 119', rating: 4.9, reviews: 92, signature: '흑빵, 크림빵(한정)' },
  ];

  /* --- 댓글 등록 --- */
  /* 입력한 텍스트를 댓글 목록에 추가하는 함수 */
  const handleCommentSubmit = () => {
    /* 빈 댓글은 무시 */
    if (!commentText.trim()) return;

    /* 새 댓글 객체 만들기 */
    const newComment = {
      id: Date.now(),             /* 고유 ID (현재 시간을 숫자로 사용) */
      author: '나',               /* 나중에 로그인한 유저 정보로 교체 */
      initial: '나',              /* 아바타에 표시할 글자 */
      date: new Date().toLocaleDateString('ko-KR', {   /* 오늘 날짜 */
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\. /g, '.').replace('.', ''),
      text: commentText,
      replies: [],                /* 새 댓글에는 답글이 아직 없음 */
    };

    /* 댓글 목록 맨 앞에 새 댓글 추가 (최신순) */
    setCommentList((prev) => [newComment, ...prev]);
    /* 입력창 비우기 */
    setCommentText('');
  };

  /* --- 답글 등록 --- */
  /* 특정 댓글(commentId)에 답글을 추가하는 함수 */
  const handleReplySubmit = (commentId) => {
    /* 빈 답글은 무시 */
    if (!replyText.trim()) return;

    /* 새 답글 객체 만들기 */
    const newReply = {
      id: Date.now(),
      author: '나',
      initial: '나',
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\. /g, '.').replace('.', ''),
      text: replyText,
    };

    /* 댓글 목록에서 해당 댓글을 찾아 답글 추가 */
    setCommentList((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    );

    /* 답글 입력창 닫기 + 입력값 초기화 */
    setReplyingTo(null);
    setReplyText('');
  };

  /* --- 별점 표시 함수 --- */
  /* 숫자(4.8)를 받아서 ★★★★☆ 형태로 바꿔줌 */
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);  /* 꽉 찬 별 개수 */
    const hasHalf = rating % 1 >= 0.5;     /* 반별이 있는지 */
    let stars = '★'.repeat(fullStars);
    if (hasHalf) stars += '☆';
    return stars;
  };

  return (
    <div className="course-detail">

      {/* ===== 1. 히어로 이미지 ===== */}
      {/* 코스의 대표 이미지가 크게 보이는 영역 */}
      <div className="cd-hero">
        <div className="cd-hero-placeholder">Hero Image</div>
        {/* ← 뒤로가기 버튼 */}
        <button className="cd-back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>

      {/* ===== 2~6: 메인 콘텐츠 영역 ===== */}
      <div className="cd-content">

        {/* ===== 2. 코스 정보 ===== */}
        <section className="cd-info">
          {/* 위치 + 날짜 */}
          <p className="cd-info-meta">
            📍 {course.location}  ·  {course.date}
          </p>
          {/* 코스 제목 */}
          <h1 className="cd-info-title">{course.title}</h1>
          {/* 작성자 */}
          <div className="cd-info-author">
            <div className="cd-author-avatar" />
            <span>{course.author}</span>
          </div>

          {/* 태그 칩들: 소요시간, 거리, 장소 수 */}
          <div className="cd-info-chips">
            <span className="cd-chip">🕐 {course.duration}</span>
            <span className="cd-chip">🚶 {course.distance}</span>
            <span className="cd-chip">📍 {course.placeCount}곳</span>
          </div>

          {/* 좋아요 + 저장 버튼 */}
          <div className="cd-info-actions">
            <button
              className={`cd-action-btn ${isLiked ? 'active' : ''}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              {isLiked ? '❤️' : '♡'} 좋아요
            </button>
            <button
              className={`cd-action-btn ${isSaved ? 'active' : ''}`}
              onClick={() => setIsSaved(!isSaved)}
            >
              {isSaved ? '🔖' : '☆'} 저장
            </button>
          </div>
        </section>

        {/* ===== 3. 코스 지도 ===== */}
        <section className="cd-map">
          <h2 className="cd-section-title">코스 지도</h2>
          {/* 지도 영역 (나중에 카카오맵 API 연동) */}
          <div className="cd-map-area">
            <span>🗺️ 지도 영역</span>
            {/* 지도 위 마커들 (임시) */}
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className="cd-map-marker"
                style={{
                  left: `${15 + num * 15}%`,
                  top: `${30 + (num % 2 === 0 ? 20 : 0)}%`,
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </section>

        {/* ===== 4. 코스 장소 목록 ===== */}
        <section className="cd-places">
          <h2 className="cd-section-title">코스 장소 ({places.length}곳)</h2>

          {places.map((place, index) => (
            <div key={place.id} className="cd-place-item">
              {/* 순서 번호 (원형 뱃지) */}
              <div className="cd-place-num">{index + 1}</div>
              {/* 장소 이미지 (임시) */}
              <div className="cd-place-img">
                <span>🍞</span>
              </div>
              {/* 장소 정보 */}
              <div className="cd-place-info">
                <h3 className="cd-place-name">{place.name}</h3>
                <p className="cd-place-address">{place.address}</p>
                <p className="cd-place-rating">
                  {renderStars(place.rating)} {place.rating} ({place.reviews})
                </p>
                <p className="cd-place-signature">시그니처: {place.signature}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ===== 5. 코스 소개 ===== */}
        <section className="cd-description">
          <h2 className="cd-section-title">코스 소개</h2>
          <p className="cd-description-text">{course.description}</p>
        </section>

        {/* ===== 6. 댓글 ===== */}
        <section className="cd-comments">
          <h2 className="cd-section-title">댓글 ({commentList.length})</h2>

          {/* --- 댓글 입력 영역 --- */}
          <div className="cd-comment-input-wrap">
            <div className="cd-comment-avatar">나</div>
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
                <button className="cd-comment-submit-btn" onClick={handleCommentSubmit}>등록</button>
              </div>
            </div>
          </div>

          {/* --- 댓글 목록 --- */}
          {commentList.map((comment) => (
            <div key={comment.id} className="cd-comment-group">

              {/* 댓글 본체 */}
              <div className="cd-comment-item">
                {/* 댓글 작성자 아바타 */}
                <div className="cd-comment-item-avatar">{comment.initial}</div>
                {/* 댓글 내용 */}
                <div className="cd-comment-item-body">
                  <div className="cd-comment-item-header">
                    <span className="cd-comment-author">{comment.author}</span>
                    <span className="cd-comment-date">{comment.date}</span>
                  </div>
                  <p className="cd-comment-text">{comment.text}</p>
                  {/* 답글 버튼: 클릭하면 답글 입력창이 열림/닫힘 */}
                  <button
                    className={`cd-comment-reply-btn ${replyingTo === comment.id ? 'active' : ''}`}
                    onClick={() => {
                      /* 이미 열려있으면 닫고, 아니면 열기 */
                      if (replyingTo === comment.id) {
                        setReplyingTo(null);
                        setReplyText('');
                      } else {
                        setReplyingTo(comment.id);
                        setReplyText('');
                      }
                    }}
                  >
                    💬 답글
                  </button>
                </div>
              </div>

              {/* --- 답글 목록 --- */}
              {comment.replies.length > 0 && (
                <div className="cd-reply-list">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="cd-reply-item">
                      {/* 답글 작성자 아바타 */}
                      <div className="cd-comment-item-avatar">{reply.initial}</div>
                      {/* 답글 내용 */}
                      <div className="cd-comment-item-body">
                        <div className="cd-comment-item-header">
                          <span className="cd-comment-author">{reply.author}</span>
                          <span className="cd-comment-date">{reply.date}</span>
                        </div>
                        <p className="cd-comment-text">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- 답글 입력창 (해당 댓글의 답글 버튼 클릭 시 표시) --- */}
              {replyingTo === comment.id && (
                <div className="cd-reply-input-wrap">
                  <div className="cd-comment-avatar">나</div>
                  <div className="cd-comment-input-box">
                    <textarea
                      className="cd-comment-input cd-reply-input"
                      placeholder={`${comment.author}님에게 답글 작성...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      /* Enter 키로 답글 등록 */
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(comment.id);
                        }
                      }}
                      autoFocus
                    />
                    <div className="cd-comment-input-actions">
                      {/* 취소 버튼 */}
                      <button
                        className="cd-reply-cancel-btn"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        취소
                      </button>
                      {/* 등록 버튼 */}
                      <button
                        className="cd-comment-submit-btn"
                        onClick={() => handleReplySubmit(comment.id)}
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
          <span>♡ {course.likes}</span>
          <span>🔖 {course.saves}</span>
        </div>
        <button className="cd-bottom-cta">이 코스로 탐방하기</button>
      </div>

    </div>
  );
}
