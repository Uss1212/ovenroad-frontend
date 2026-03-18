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

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CommunityDetail.css';

export default function CommunityDetail() {

  /* --- URL에서 글 번호(id) 꺼내기 --- */
  /* 예: /community/3 이면 id = "3" */
  const { id } = useParams();

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 댓글 입력 상태 --- */
  /* 사용자가 댓글 입력창에 쓰고 있는 내용을 저장 */
  const [commentText, setCommentText] = useState('');

  /* --- 좋아요 눌렀는지 상태 --- */
  const [liked, setLiked] = useState(false);

  /* --- 답글 관련 상태 --- */
  /* replyingTo: 지금 답글 입력창이 열려있는 댓글의 id (없으면 null) */
  const [replyingTo, setReplyingTo] = useState(null);

  /* replyText: 답글 입력창에 쓰고 있는 내용 */
  const [replyText, setReplyText] = useState('');

  /* --- 공유 완료 메시지 표시 상태 --- */
  /* 링크 복사 후 "복사 완료!" 메시지를 잠깐 보여줌 */
  const [copied, setCopied] = useState(false);

  /* --- 공유하기 (링크 복사) 함수 --- */
  /* 현재 페이지 URL을 클립보드에 복사하는 함수 */
  const handleShare = async () => {
    try {
      /* navigator.clipboard: 브라우저의 클립보드(복사/붙여넣기) 기능 */
      /* window.location.href: 현재 페이지의 전체 URL 주소 */
      await navigator.clipboard.writeText(window.location.href);

      /* 복사 성공하면 "복사 완료!" 메시지 표시 */
      setCopied(true);

      /* 2초 후에 메시지를 다시 숨김 */
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 클립보드 접근이 안 되는 경우 (예: 오래된 브라우저) */
      /* prompt 창으로 대체 — 사용자가 직접 복사할 수 있게 */
      prompt('아래 링크를 복사해주세요:', window.location.href);
    }
  };

  /* --- 게시글 더미 데이터 --- */
  /* 나중에 백엔드 API에서 id로 조회해서 받아올 예정 */
  const allPosts = [
    {
      id: 1,
      category: '후기',
      title: '연남동 빵지순례 다녀왔어요! 소금빵 진짜 맛있음',
      content: `바로 베이커리 소금빵이 진짜 미쳤어요... 겉은 바삭하고 안은 촉촉한데 버터가 쫙 퍼지는 그 맛... 줄 서서 먹을 가치 있습니다!

오늘 연남동에서 빵지순례 코스 돌았는데 정말 대만족이었어요.

첫 번째로 간 곳은 바로 베이커리인데, 소금빵이 시그니처예요. 오전 11시쯤 도착했는데 이미 줄이 5팀 정도 있었어요. 근데 회전이 빨라서 10분 정도만 기다렸어요.

소금빵은 겉이 바삭바삭하고 안에 버터가 가득 차 있어서 한 입 베어물면 버터가 쫙~ 퍼져요. 진짜 행복한 맛이에요.

두 번째로 간 곳은 밀도인데, 여기는 식빵이 유명해요. 쫄깃쫄깃한 식감이 독특하고, 밤식빵이 특히 맛있었어요.

세 번째는 카페 레이어드! 여기는 분위기가 너무 좋고, 크루아상이 맛있어요. 아메리카노랑 같이 먹으면 완벽한 조합이에요.

다음에는 을지로 쪽도 가보려고 해요. 태극당 야채샐러드빵 먹어보고 싶어요!`,
      author: '빵순이',
      authorAvatar: '빵',
      date: '2025.12.27',
      time: '14:32',
      likes: 47,
      comments: 12,
      views: 234,
      hasImage: true,
    },
    {
      id: 2,
      category: '질문',
      title: '종로 쪽에 당근케이크 맛집 아시는 분?',
      content: `종로나 광화문 근처에서 당근케이크 맛있는 곳 추천해주세요!

생일에 사갈건데 예쁘고 맛있는 곳이면 좋겠어요. 예산은 3만원 정도 생각하고 있어요.

조각 케이크가 아니라 홀케이크로 사고 싶은데, 당일 구매 가능한 곳이면 더 좋겠어요.

혹시 아시는 분 있으면 댓글로 알려주세요! 미리 감사합니다.`,
      author: '케이크러버',
      authorAvatar: '케',
      date: '2025.12.27',
      time: '10:15',
      likes: 15,
      comments: 8,
      views: 156,
      hasImage: false,
    },
    {
      id: 3,
      category: '꿀팁',
      title: '빵집 웨이팅 없이 가는 꿀팁 공유합니다',
      content: `유명 빵집들 오픈 시간 30분 전에 가면 거의 줄 없이 들어갈 수 있어요. 특히 평일 오전이 최고!

그리고 인스타에서 실시간 웨이팅 확인하면 편해요.

제가 그동안 빵집 100곳 넘게 다니면서 터득한 꿀팁들 공유할게요:

1. 오픈런이 답이다 - 대부분의 빵집은 오전 10-11시에 오픈하는데, 오픈 30분 전에 가면 첫 타임에 들어갈 수 있어요.

2. 평일 오전을 노려라 - 주말은 무조건 줄이 길어요. 가능하면 평일 오전에 가세요.

3. 인스타 스토리 확인 - 요즘 빵집들이 인스타 스토리로 현재 웨이팅 상황을 올려줘요.

4. 네이버 예약 활용 - 일부 빵집은 네이버 예약이 가능해요. 미리 예약하면 웨이팅 없이 바로 입장!

5. 빵 나오는 시간 체크 - 빵집마다 빵이 나오는 시간이 정해져 있어요. 그 시간에 맞춰가면 갓 구운 빵을 먹을 수 있어요.`,
      author: '빵덕후',
      authorAvatar: '덕',
      date: '2025.12.26',
      time: '18:45',
      likes: 89,
      comments: 23,
      views: 567,
      hasImage: false,
    },
    {
      id: 4,
      category: '자유',
      title: '오늘 빵 털이 성공',
      content: `퇴근길에 밀도 들렀는데 마감세일 해서 식빵 2개, 밤식빵 1개 득템했어요!

원래 2만원인데 만이천원에 샀습니다 ㅎㅎ

마감 세일은 보통 저녁 7시 이후에 시작하는데, 빵 종류는 그날그날 달라요. 오늘은 운 좋게 밤식빵이 남아있었어요!

밀도 밤식빵 진짜 맛있는데 원래 품절 빨리 되거든요. 마감 세일로 득템해서 너무 기분 좋아요.

여러분도 퇴근길에 빵집 마감 세일 노려보세요!`,
      author: '빵털이범',
      authorAvatar: '털',
      date: '2025.12.26',
      time: '20:10',
      likes: 62,
      comments: 18,
      views: 345,
      hasImage: true,
    },
    {
      id: 5,
      category: '후기',
      title: '을지로 레트로 빵투어 코스 후기',
      content: `태극당 → 오월의 종 → 카페 레이어드 순서로 돌았는데요, 태극당 야채샐러드빵은 진짜 전설이에요. 60년 전통의 맛...

태극당은 1946년부터 영업한 서울에서 가장 오래된 빵집 중 하나예요. 야채샐러드빵, 모카빵이 시그니처인데 맛이 정말 독특해요.

오월의 종은 을지로 골목에 숨어있는 작은 빵집인데, 수제 단팥빵이 맛있어요. 팥이 달지 않고 깊은 맛이 나요.

마지막으로 카페 레이어드는 을지로점이 분위기가 좋아요. 크루아상이랑 아메리카노 조합이 최고!

을지로 빵투어 강력 추천합니다!`,
      author: '레트로빵',
      authorAvatar: '레',
      date: '2025.12.25',
      time: '16:20',
      likes: 73,
      comments: 15,
      views: 412,
      hasImage: true,
    },
    {
      id: 6,
      category: '모임',
      title: '[모집] 1/5 토요일 성수동 빵투어 같이 가실 분!',
      content: `성수동 빵집 4곳 돌 예정이에요. 오후 2시 성수역 3번 출구 집합!

현재 3/6명 모집 완료. 관심 있으시면 댓글 달아주세요~

코스: 오뗄뒤빵 → 베이커리 무무 → 카페 어니언 → 대도시빵집

소요시간: 약 3시간
참가비: 각자 부담 (1인 예상 2만원 내외)

빵 좋아하시는 분이면 누구나 환영이에요! 같이 맛있는 빵 먹으면서 빵 이야기 나눠요.`,
      author: '빵모임장',
      authorAvatar: '모',
      date: '2025.12.25',
      time: '12:00',
      likes: 34,
      comments: 27,
      views: 289,
      hasImage: false,
    },
    {
      id: 7,
      category: '꿀팁',
      title: '빵 보관법 총정리! 냉동하면 한 달도 OK',
      content: `빵을 많이 사면 먹기 전에 딱딱해지잖아요. 랩으로 하나씩 감싸서 지퍼백에 넣고 냉동하면 한 달까지 보관 가능해요.

먹을 때는 오븐 180도에서 5분!

빵 종류별 보관법을 정리해봤어요:

1. 식빵 - 한 장씩 랩으로 감싸서 냉동. 먹을 때 토스터기로 구우면 갓 구운 맛!
2. 바게트 - 먹을 만큼 잘라서 랩으로 감싸고 냉동. 오븐 200도에서 7분.
3. 크루아상 - 랩으로 감싸서 냉동. 먹기 전날 냉장실로 옮겨 해동 후 오븐 170도 5분.
4. 머핀/스콘 - 개별 포장 후 냉동. 자연해동 또는 전자레인지 30초.
5. 소금빵 - 당일 먹는 게 최고! 냉동하면 버터 풍미가 좀 줄어요.

참고로 냉장 보관은 오히려 빵을 빨리 딱딱하게 만들어요. 냉장보다는 냉동이 훨씬 좋아요!`,
      author: '빵박사',
      authorAvatar: '박',
      date: '2025.12.24',
      time: '09:30',
      likes: 112,
      comments: 31,
      views: 789,
      hasImage: false,
    },
    {
      id: 8,
      category: '자유',
      title: '빵지순례 앱 너무 좋아요',
      content: `코스 만들기 기능으로 우리 동네 빵집 코스 만들었는데 친구들한테 공유했더니 다들 좋아해요!

개발자님 감사합니다!

지도에서 빵집 찾기도 편하고, 코스 만들기에서 경로도 나오고, 리뷰도 볼 수 있고...

특히 빵집 뱃지 시스템이 좋아요. 블루리본, 천하제빵, 제빵명장 뱃지가 있으면 믿고 가게 되더라고요.

앞으로도 좋은 기능 많이 추가해주세요!`,
      author: '빵앱팬',
      authorAvatar: '팬',
      date: '2025.12.24',
      time: '15:00',
      likes: 56,
      comments: 9,
      views: 198,
      hasImage: false,
    },
  ];

  /* --- 현재 글 찾기 --- */
  /* URL의 id로 더미 데이터에서 해당 글을 찾음 */
  const post = allPosts.find((p) => p.id === Number(id));

  /* --- 댓글 더미 데이터 --- */
  /* 나중에 백엔드 API에서 해당 글의 댓글을 받아올 예정 */
  const [comments, setComments] = useState([
    {
      id: 1,
      author: '크루아상팬',
      authorAvatar: '크',
      content: '저도 바로 베이커리 소금빵 좋아해요! 버터 풍미가 진짜 최고',
      date: '2025.12.27',
      time: '15:10',
      likes: 8,
      /* replies: 이 댓글에 달린 답글(대댓글) 목록 */
      replies: [
        {
          id: 101,
          author: '빵순이',
          authorAvatar: '빵',
          content: '맞아요! 소금빵은 바로 베이커리가 최고예요 ㅎㅎ',
          date: '2025.12.27',
          time: '15:30',
          likes: 3,
        },
      ],
    },
    {
      id: 2,
      author: '빵러버',
      authorAvatar: '러',
      content: '밀도 밤식빵도 꼭 드셔보세요! 연남동이면 걸어갈 수 있어요',
      date: '2025.12.27',
      time: '16:45',
      likes: 5,
      replies: [],
    },
    {
      id: 3,
      author: '디저트킹',
      authorAvatar: '킹',
      content: '카페 레이어드 크루아상은 저도 인정합니다 ㅎㅎ 분위기도 좋고',
      date: '2025.12.27',
      time: '18:20',
      likes: 3,
      replies: [
        {
          id: 102,
          author: '레트로빵',
          authorAvatar: '레',
          content: '레이어드 을지로점도 추천해요! 분위기 미쳤어요',
          date: '2025.12.27',
          time: '19:00',
          likes: 1,
        },
      ],
    },
    {
      id: 4,
      author: '오븐마스터',
      authorAvatar: '오',
      content: '연남동 코스 좋네요! 저도 다음 주에 가볼게요. 혹시 주차는 어떻게 하셨어요?',
      date: '2025.12.28',
      time: '09:05',
      likes: 2,
      replies: [],
    },
  ]);

  /* --- 카테고리별 색상 --- */
  /* Community.jsx와 동일한 색상 사용 */
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

  /* --- 댓글 작성 --- */
  /* 댓글 입력창에서 "등록" 버튼을 누르면 실행 */
  const handleCommentSubmit = () => {
    /* 빈 내용이면 무시 */
    if (!commentText.trim()) return;

    /* 새 댓글 객체 만들기 */
    const newComment = {
      id: comments.length + 1,
      author: '나',
      authorAvatar: '나',
      content: commentText.trim(),
      date: '2025.12.28',
      time: '지금',
      likes: 0,
      replies: [],  /* 새 댓글에는 답글이 아직 없음 */
    };

    /* 댓글 목록에 추가 */
    setComments([...comments, newComment]);

    /* 입력창 비우기 */
    setCommentText('');
  };

  /* --- 답글 입력창 토글 --- */
  /* "답글" 버튼을 누르면 해당 댓글 아래에 입력창을 열거나 닫음 */
  const handleReplyToggle = (commentId) => {
    if (replyingTo === commentId) {
      /* 이미 열려있으면 닫기 */
      setReplyingTo(null);
      setReplyText('');
    } else {
      /* 다른 댓글의 답글 입력창 열기 */
      setReplyingTo(commentId);
      setReplyText('');
    }
  };

  /* --- 답글 등록 --- */
  /* 답글 입력창에서 "등록" 버튼을 누르면 실행 */
  const handleReplySubmit = (commentId) => {
    /* 빈 내용이면 무시 */
    if (!replyText.trim()) return;

    /* 새 답글 객체 만들기 */
    const newReply = {
      id: Date.now(),  /* 임시 고유 id (현재 시간을 숫자로 사용) */
      author: '나',
      authorAvatar: '나',
      content: replyText.trim(),
      date: '2025.12.28',
      time: '지금',
      likes: 0,
    };

    /* 댓글 목록에서 해당 댓글을 찾아서 답글 추가 */
    setComments(comments.map((c) => {
      if (c.id === commentId) {
        /* 해당 댓글의 replies 배열에 새 답글을 추가 */
        return { ...c, replies: [...c.replies, newReply] };
      }
      return c;
    }));

    /* 답글 입력창 닫기 + 내용 비우기 */
    setReplyingTo(null);
    setReplyText('');
  };

  /* --- 글을 찾지 못했을 때 --- */
  /* 잘못된 id로 들어오면 "글을 찾을 수 없음" 표시 */
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
      {/* 뒤로가기 버튼: 커뮤니티 목록 페이지로 돌아감 */}
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
            color: getCategoryColor(post.category),
            backgroundColor: getCategoryColor(post.category) + '15',
          }}
        >
          {post.category}
        </span>

        {/* 글 제목 */}
        <h1 className="cd-title">{post.title}</h1>

        {/* 작성자 정보 + 날짜 */}
        <div className="cd-author-row">
          {/* 작성자 아바타 (원형, 이니셜) */}
          <div className="cd-author-avatar">
            <span>{post.authorAvatar}</span>
          </div>
          {/* 작성자 이름 + 작성 시간 */}
          <div className="cd-author-info">
            <span className="cd-author-name">{post.author}</span>
            <span className="cd-author-date">{post.date} {post.time}</span>
          </div>
          {/* 조회수 */}
          <span className="cd-views">조회 {post.views}</span>
        </div>
      </div>

      {/* ===== 3. 글 본문 영역 ===== */}
      <div className="cd-body">
        {/* 이미지가 있으면 이미지 표시 (임시 플레이스홀더) */}
        {post.hasImage && (
          <div className="cd-image-area">
            <span>📷 이미지</span>
          </div>
        )}

        {/* 본문 텍스트 */}
        {/* 줄바꿈(\n)을 그대로 보여주기 위해 각 줄을 <p> 태그로 감싼다 */}
        <div className="cd-content">
          {post.content.split('\n').map((line, i) => (
            <p key={i} className={line.trim() === '' ? 'cd-empty-line' : ''}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>

      {/* ===== 4. 좋아요 + 공유 버튼 ===== */}
      <div className="cd-actions">
        {/* 좋아요 버튼 */}
        <button
          className={`cd-like-btn ${liked ? 'liked' : ''}`}
          onClick={() => setLiked(!liked)}
        >
          {liked ? '❤️' : '🤍'} 좋아요 {liked ? post.likes + 1 : post.likes}
        </button>

        {/* 공유 버튼: 누르면 현재 페이지 URL을 클립보드에 복사 */}
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
          {/* 내 아바타 */}
          <div className="cd-comment-my-avatar">
            <span>나</span>
          </div>
          {/* 입력 영역 */}
          <div className="cd-comment-input-area">
            <textarea
              className="cd-comment-textarea"
              placeholder="댓글을 입력해주세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              /* 엔터키(Enter)로도 등록 가능 (Shift+Enter는 줄바꿈) */
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
            />
            {/* 등록 버튼 */}
            <button
              className="cd-comment-submit-btn"
              onClick={handleCommentSubmit}
              /* 내용이 없으면 버튼 비활성화 */
              disabled={!commentText.trim()}
            >
              등록
            </button>
          </div>
        </div>

        {/* --- 댓글 목록 --- */}
        <div className="cd-comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="cd-comment-wrap">
              {/* ── 댓글 본체 ── */}
              <div className="cd-comment">
                {/* 댓글 작성자 아바타 */}
                <div className="cd-comment-avatar">
                  <span>{comment.authorAvatar}</span>
                </div>
                {/* 댓글 내용 영역 */}
                <div className="cd-comment-body">
                  {/* 작성자 이름 + 시간 */}
                  <div className="cd-comment-header">
                    <span className="cd-comment-author">{comment.author}</span>
                    <span className="cd-comment-date">{comment.date} {comment.time}</span>
                  </div>
                  {/* 댓글 텍스트 */}
                  <p className="cd-comment-text">{comment.content}</p>
                  {/* 좋아요 + 답글 버튼 */}
                  <div className="cd-comment-actions">
                    {/* 답글 버튼: 누르면 답글 입력창이 열림/닫힘 */}
                    <button
                      className={`cd-comment-reply-btn ${replyingTo === comment.id ? 'active' : ''}`}
                      onClick={() => handleReplyToggle(comment.id)}
                    >
                      답글 {comment.replies.length > 0 ? comment.replies.length : ''}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 답글(대댓글) 목록 ── */}
              {/* 답글이 1개 이상 있을 때만 표시 */}
              {comment.replies.length > 0 && (
                <div className="cd-reply-list">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="cd-reply">
                      {/* 답글 작성자 아바타 */}
                      <div className="cd-reply-avatar">
                        <span>{reply.authorAvatar}</span>
                      </div>
                      {/* 답글 내용 */}
                      <div className="cd-reply-body">
                        <div className="cd-comment-header">
                          <span className="cd-comment-author">{reply.author}</span>
                          <span className="cd-comment-date">{reply.date} {reply.time}</span>
                        </div>
                        <p className="cd-comment-text">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 답글 입력창 ── */}
              {/* replyingTo가 현재 댓글 id와 같을 때만 표시 */}
              {replyingTo === comment.id && (
                <div className="cd-reply-input-wrap">
                  {/* 내 아바타 */}
                  <div className="cd-reply-my-avatar">
                    <span>나</span>
                  </div>
                  {/* 입력 영역 */}
                  <div className="cd-reply-input-area">
                    <textarea
                      className="cd-reply-textarea"
                      placeholder={`${comment.author}님에게 답글 작성...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      /* 엔터키로 등록 (Shift+Enter는 줄바꿈) */
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(comment.id);
                        }
                      }}
                      /* 입력창이 열리면 자동으로 커서가 가도록 */
                      autoFocus
                    />
                    {/* 버튼 묶음 */}
                    <div className="cd-reply-btn-group">
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
                        className="cd-reply-submit-btn"
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
