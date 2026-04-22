/* ===================================================
   CommunityDetail 컴포넌트 (커뮤니티 글 상세 페이지)
   - 커뮤니티 목록에서 글을 클릭하면 이 페이지로 이동
   - 구성:
     1) 뒤로가기 버튼
     2) 카테고리 뱃지 + 제목 + 작성자 정보
     3) 글 본문 내용
     4) 이미지 (있으면 표시)
     5) 좋아요 / 공유 버튼
     6) 댓글 목록 + 댓글 입력창
   =================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoardDetail, toggleBoardLike, createComment, deleteBoard, deleteComment } from '../../api/apiAxios';
import './CommunityDetail.css';

export default function CommunityDetail() {

  /* --- URL에서 글 번호(id) 꺼내기 --- */
  const { id } = useParams();

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */
  const [post, setPost] = useState(null);       /* 게시글 데이터 */
  const [comments, setComments] = useState([]);  /* 댓글 목록 */
  const [loading, setLoading] = useState(true);  /* 로딩 중? */
  const [commentText, setCommentText] = useState(''); /* 댓글 입력 내용 */
  const [liked, setLiked] = useState(false);     /* 좋아요 눌렀는지 */
  const [likeCount, setLikeCount] = useState(0); /* 좋아요 수 */
  const [copied, setCopied] = useState(false);   /* 링크 복사 완료? */

  /* 현재 로그인한 사용자 정보 */
  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;

  /* --- 게시글 데이터 불러오기 --- */
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(id);
        setPost(data);
        setComments(data.comments || []);
        setLikeCount(data.likes || 0);
      } catch (err) {
        console.error('게시글 불러오기 실패:', err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  /* --- 공유하기 (링크 복사) 함수 --- */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('아래 링크를 복사해주세요:', window.location.href);
    }
  };

  /* --- 카테고리별 색상 --- */
  const getCategoryColor = (category) => {
    const colors = {
      '자유': '#3b82f6',
      '후기': '#f59e0b',
      '질문': '#8b5cf6',
      '꿀팁': '#22c55e',
      '모임': '#ec4899',
    };
    return colors[category] || '#888888';
  };

  /* --- 좋아요 토글 --- */
  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다!');
      return;
    }
    try {
      const result = await toggleBoardLike(id, currentUser.userNum);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  /* --- 댓글 작성 --- */
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) {
      alert('로그인이 필요합니다!');
      return;
    }
    try {
      const newComment = await createComment(id, currentUser.userNum, commentText.trim());
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (err) {
      alert('댓글 등록에 실패했습니다.');
    }
  };

  /* --- 댓글 삭제 --- */
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(id, commentId, currentUser.userNum);
      setComments(comments.filter(c => c.COMMENT_NUM !== commentId));
    } catch (err) {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  /* --- 게시글 삭제 --- */
  const handleDeletePost = async () => {
    if (!window.confirm('글을 삭제하시겠습니까?')) return;
    try {
      await deleteBoard(id, currentUser.userNum);
      alert('글이 삭제되었습니다.');
      navigate('/community');
    } catch (err) {
      alert('글 삭제에 실패했습니다.');
    }
  };

  /* --- 로딩 중 --- */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#999' }}>
        게시글을 불러오는 중...
      </div>
    );
  }

  /* --- 글을 찾지 못했을 때 --- */
  if (!post) {
    return (
      <div className="cd-not-found">
        <div className="cd-not-found-icon">📭</div>
        <h2>게시글을 찾을 수 없어요</h2>
        <p>삭제되었거나 잘못된 주소예요</p>
        <button
          className="cd-back-btn-big"
          onClick={() => navigate('/community')}
        >
          커뮤니티로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="community-detail">

      {/* ===== 1. 상단 네비게이션 ===== */}
      <button
        className="cd-back-btn"
        onClick={() => navigate('/community')}
      >
        ← 커뮤니티
      </button>

      {/* ===== 2. 글 헤더 영역 ===== */}
      <div className="cd-post-header">
        {/* 카테고리 뱃지 */}
        <span
          className="cd-category"
          style={{
            color: getCategoryColor(post.CATEGORY),
            backgroundColor: getCategoryColor(post.CATEGORY) + '15',
          }}
        >
          {post.CATEGORY}
        </span>

        {/* 글 제목 */}
        <h1 className="cd-title">{post.TITLE}</h1>

        {/* 작성자 정보 + 날짜 */}
        <div className="cd-author-row">
          {/* 작성자 아바타 (원형, 이니셜) */}
          <div className="cd-author-avatar">
            <span>{post.author?.charAt(0) || '?'}</span>
          </div>
          {/* 작성자 이름 + 작성 시간 */}
          <div className="cd-author-info">
            <span className="cd-author-name">{post.author}</span>
            <span className="cd-author-date">{new Date(post.CREATED_TIME).toLocaleString('ko-KR')}</span>
          </div>
          {/* 조회수 */}
          <span className="cd-views">조회 {post.VIEWS}</span>
        </div>

        {/* 본인 글이면 수정/삭제 버튼 표시 */}
        {currentUser && currentUser.userNum === post.USER_NUM && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate(`/community/edit/${post.BOARD_NUM}`)}
              style={{ color: '#c96442', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDeletePost}
              style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </div>

      {/* ===== 3. 글 본문 영역 ===== */}
      <div className="cd-body">
        {/* 이미지가 있으면 표시 */}
        {post.images && post.images.length > 0 && (
          <div className={`cd-image-area ${
            post.images.length === 2 ? 'cd-images-2' :
            post.images.length >= 3 ? 'cd-images-multi' : ''
          }`}>
            {post.images.map((img, i) => (
              <img key={i} src={img} alt={`첨부 ${i + 1}`} />
            ))}
          </div>
        )}

        {/* 본문 텍스트 */}
        <div className="cd-content">
          {post.CONTENT.split('\n').map((line, i) => (
            <p key={i} className={line.trim() === '' ? 'cd-empty-line' : ''}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>

      {/* ===== 4. 좋아요 + 공유 버튼 ===== */}
      <div className="cd-actions">
        <button
          className={`cd-like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {liked ? '❤️' : '🤍'} 좋아요 {likeCount}
        </button>

        <button className="cd-share-btn" onClick={handleShare}>
          {copied ? '✅ 링크 복사 완료!' : '🔗 공유하기'}
        </button>
      </div>

      {/* ===== 5. 댓글 영역 ===== */}
      <div className="cd-comments-section">
        {/* 댓글 개수 표시 */}
        <h3 className="cd-comments-title">
          💬 댓글 {comments.length}개
        </h3>

        {/* --- 댓글 입력창 --- */}
        <div className="cd-comment-input-wrap">
          <div className="cd-comment-my-avatar">
            <span>{currentUser?.nickname?.charAt(0) || '?'}</span>
          </div>
          <div className="cd-comment-input-area">
            <textarea
              className="cd-comment-textarea"
              placeholder={currentUser ? '댓글을 입력해주세요...' : '로그인 후 댓글을 작성할 수 있어요'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              disabled={!currentUser}
            />
            <button
              className="cd-comment-submit-btn"
              onClick={handleCommentSubmit}
              disabled={!commentText.trim() || !currentUser}
            >
              등록
            </button>
          </div>
        </div>

        {/* --- 댓글 목록 --- */}
        <div className="cd-comment-list">
          {comments.map((comment) => (
            <div key={comment.COMMENT_NUM} className="cd-comment-wrap">
              <div className="cd-comment">
                {/* 댓글 작성자 아바타 */}
                <div className="cd-comment-avatar">
                  <span>{comment.author?.charAt(0) || '?'}</span>
                </div>
                {/* 댓글 내용 영역 */}
                <div className="cd-comment-body">
                  <div className="cd-comment-header">
                    <span className="cd-comment-author">{comment.author}</span>
                    <span className="cd-comment-date">{new Date(comment.CREATED_TIME).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="cd-comment-text">{comment.CONTENT}</p>
                  {/* 본인 댓글이면 삭제 버튼 */}
                  {currentUser && currentUser.userNum === comment.USER_NUM && (
                    <button
                      onClick={() => handleDeleteComment(comment.COMMENT_NUM)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
