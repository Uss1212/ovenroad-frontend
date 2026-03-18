/* ===================================================
   Community 컴포넌트 (커뮤니티 페이지)
   - 빵순이들이 자유롭게 소통하는 게시판 페이지
   - 구성:
     1) 페이지 제목 + 설명
     2) 카테고리 탭 (전체, 자유, 후기, 질문, 꿀팁, 모임)
     3) 글쓰기 버튼
     4) 게시글 목록 (카드형)
     5) 인기 게시글 사이드바 (데스크탑)
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Community.css';

export default function Community() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 사용하는 함수 */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */

  /* 현재 선택한 카테고리 탭 */
  const [activeTab, setActiveTab] = useState('전체');

  /* --- 카테고리 탭 목록 --- */
  const tabs = [
    { name: '전체', icon: '📋' },
    { name: '자유', icon: '💬' },
    { name: '후기', icon: '⭐' },
    { name: '질문', icon: '❓' },
    { name: '꿀팁', icon: '🍯' },
    { name: '모임', icon: '👥' },
  ];

  /* --- 게시글 더미 데이터 --- */
  /* 나중에 백엔드 API에서 받아올 예정 */
  const posts = [
    {
      id: 1,
      category: '후기',
      title: '연남동 빵지순례 다녀왔어요! 소금빵 진짜 맛있음',
      content: '바로 베이커리 소금빵이 진짜 미쳤어요... 겉은 바삭하고 안은 촉촉한데 버터가 쫙 퍼지는 그 맛... 줄 서서 먹을 가치 있습니다!',
      author: '빵순이',
      date: '2025.12.27',
      likes: 47,
      comments: 12,
      views: 234,
      hasImage: true,
    },
    {
      id: 2,
      category: '질문',
      title: '종로 쪽에 당근케이크 맛집 아시는 분?',
      content: '종로나 광화문 근처에서 당근케이크 맛있는 곳 추천해주세요! 생일에 사갈건데 예쁘고 맛있는 곳이면 좋겠어요.',
      author: '케이크러버',
      date: '2025.12.27',
      likes: 15,
      comments: 8,
      views: 156,
      hasImage: false,
    },
    {
      id: 3,
      category: '꿀팁',
      title: '빵집 웨이팅 없이 가는 꿀팁 공유합니다',
      content: '유명 빵집들 오픈 시간 30분 전에 가면 거의 줄 없이 들어갈 수 있어요. 특히 평일 오전이 최고! 그리고 인스타에서 실시간 웨이팅 확인하면 편해요.',
      author: '빵덕후',
      date: '2025.12.26',
      likes: 89,
      comments: 23,
      views: 567,
      hasImage: false,
    },
    {
      id: 4,
      category: '자유',
      title: '오늘 빵 털이 성공 🍞🍞🍞',
      content: '퇴근길에 밀도 들렀는데 마감세일 해서 식빵 2개, 밤식빵 1개 득템했어요! 원래 2만원인데 만이천원에 샀습니다 ㅎㅎ',
      author: '빵털이범',
      date: '2025.12.26',
      likes: 62,
      comments: 18,
      views: 345,
      hasImage: true,
    },
    {
      id: 5,
      category: '후기',
      title: '을지로 레트로 빵투어 코스 후기',
      content: '태극당 → 오월의 종 → 카페 레이어드 순서로 돌았는데요, 태극당 야채샐러드빵은 진짜 전설이에요. 60년 전통의 맛...',
      author: '레트로빵',
      date: '2025.12.25',
      likes: 73,
      comments: 15,
      views: 412,
      hasImage: true,
    },
    {
      id: 6,
      category: '모임',
      title: '[모집] 1/5 토요일 성수동 빵투어 같이 가실 분!',
      content: '성수동 빵집 4곳 돌 예정이에요. 오후 2시 성수역 3번 출구 집합! 현재 3/6명 모집 완료. 관심 있으시면 댓글 달아주세요~',
      author: '빵모임장',
      date: '2025.12.25',
      likes: 34,
      comments: 27,
      views: 289,
      hasImage: false,
    },
    {
      id: 7,
      category: '꿀팁',
      title: '빵 보관법 총정리! 냉동하면 한 달도 OK',
      content: '빵을 많이 사면 먹기 전에 딱딱해지잖아요. 랩으로 하나씩 감싸서 지퍼백에 넣고 냉동하면 한 달까지 보관 가능해요. 먹을 때는 오븐 180도에서 5분!',
      author: '빵박사',
      date: '2025.12.24',
      likes: 112,
      comments: 31,
      views: 789,
      hasImage: false,
    },
    {
      id: 8,
      category: '자유',
      title: '빵지순례 앱 너무 좋아요 ㅠㅠ',
      content: '코스 만들기 기능으로 우리 동네 빵집 코스 만들었는데 친구들한테 공유했더니 다들 좋아해요! 개발자님 감사합니다 ❤️',
      author: '빵앱팬',
      date: '2025.12.24',
      likes: 56,
      comments: 9,
      views: 198,
      hasImage: false,
    },
  ];

  /* --- 인기 게시글 (좋아요 많은 순 상위 5개) --- */
  const popularPosts = [...posts]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  /* --- 카테고리 필터링 --- */
  const filteredPosts = activeTab === '전체'
    ? posts
    : posts.filter((p) => p.category === activeTab);

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

  return (
    <div className="community">

      {/* ===== 1. 페이지 헤더 ===== */}
      <div className="cm-header">
        <h1 className="cm-title">커뮤니티</h1>
        <p className="cm-subtitle">빵순이들과 함께 빵 이야기를 나눠보세요</p>
      </div>

      {/* ===== 2. 카테고리 탭 + 글쓰기 버튼 ===== */}
      <div className="cm-tab-bar">
        <div className="cm-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`cm-tab ${activeTab === tab.name ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.name)}
            >
              <span className="cm-tab-icon">{tab.icon}</span>
              <span className="cm-tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
        <button className="cm-write-btn" onClick={() => navigate('/community/write')}>✏️ 글쓰기</button>
      </div>

      {/* ===== 3. 메인 영역: 게시글 목록 + 사이드바 ===== */}
      <div className="cm-content">

        {/* --- 왼쪽: 게시글 목록 --- */}
        <div className="cm-post-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="cm-post-card" onClick={() => navigate(`/community/${post.id}`)}>
              {/* 카드 상단: 카테고리 + 날짜 */}
              <div className="cm-post-top">
                <span
                  className="cm-post-category"
                  style={{ color: getCategoryColor(post.category), backgroundColor: getCategoryColor(post.category) + '15' }}
                >
                  {post.category}
                </span>
                <span className="cm-post-date">{post.date}</span>
              </div>

              {/* 제목 */}
              <h3 className="cm-post-title">{post.title}</h3>

              {/* 내용 미리보기 (2줄까지) */}
              <p className="cm-post-content">{post.content}</p>

              {/* 이미지가 있으면 이미지 자리 표시 */}
              {post.hasImage && (
                <div className="cm-post-image">
                  <span>📷 이미지</span>
                </div>
              )}

              {/* 하단: 작성자 + 좋아요/댓글/조회수 */}
              <div className="cm-post-footer">
                <span className="cm-post-author">{post.author}</span>
                <div className="cm-post-stats">
                  <span className="cm-stat">❤️ {post.likes}</span>
                  <span className="cm-stat">💬 {post.comments}</span>
                  <span className="cm-stat">👁 {post.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- 오른쪽: 사이드바 (인기 게시글) --- */}
        <aside className="cm-sidebar">
          {/* 인기 게시글 박스 */}
          <div className="cm-popular-box">
            <h3 className="cm-popular-title">🔥 인기 게시글</h3>
            <div className="cm-popular-list">
              {popularPosts.map((post, index) => (
                <div key={post.id} className="cm-popular-item" onClick={() => navigate(`/community/${post.id}`)} style={{ cursor: 'pointer' }}>
                  {/* 순위 번호 */}
                  <span className={`cm-popular-rank ${index < 3 ? 'top3' : ''}`}>
                    {index + 1}
                  </span>
                  {/* 제목 (1줄 말줄임) */}
                  <span className="cm-popular-name">{post.title}</span>
                  {/* 좋아요 수 */}
                  <span className="cm-popular-likes">❤️ {post.likes}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
