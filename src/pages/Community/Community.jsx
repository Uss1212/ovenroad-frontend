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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoardList, getPopularPosts, BASE_URL } from '../../api/apiAxios'; /* 게시판 API */
import './Community.css';

export default function Community() {

  /* --- 페이지 이동 도구 --- */
  /* useNavigate: 다른 페이지로 이동할 때 사용하는 함수 */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */

  /* 현재 선택한 카테고리 탭 */
  const [activeTab, setActiveTab] = useState('전체');

  /* 검색어 입력값 */
  const [searchInput, setSearchInput] = useState('');

  /* 실제로 검색 요청에 사용되는 검색어 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /* DB에서 가져온 게시글 목록 */
  const [posts, setPosts] = useState([]);

  /* DB에서 가져온 인기 게시글 */
  const [popularPosts, setPopularPosts] = useState([]);

  /* 로딩 중인지 여부 */
  const [loading, setLoading] = useState(true);

  /* --- 게시글 데이터 불러오기 --- */
  /* 페이지가 열리거나, 카테고리 탭/검색어가 바뀔 때 실행 */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        /* 게시글 목록 + 인기 게시글 동시에 가져오기 */
        const [boardData, popularData] = await Promise.all([
          getBoardList(activeTab, searchKeyword),
          getPopularPosts(),
        ]);
        setPosts(boardData);
        setPopularPosts(popularData);
      } catch (err) {
        console.error('게시글 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, searchKeyword]);

  /* --- 검색 실행 --- */
  /* 엔터 키를 누르거나 검색 버튼을 클릭하면 실행 */
  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  /* --- 카테고리 탭 목록 --- */
  const tabs = [
    { name: '전체', icon: '📋' },
    { name: '자유', icon: '💬' },
    { name: '후기', icon: '⭐' },
    { name: '질문', icon: '❓' },
    { name: '꿀팁', icon: '🍯' },
    { name: '모임', icon: '👥' },
  ];

  /* --- 카테고리 필터링 --- */
  /* DB에서 이미 카테고리별로 가져오므로 그대로 사용 */
  const filteredPosts = posts;

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

      {/* ===== 2. 검색창 ===== */}
      <div className="cm-search-bar">
        <input
          type="text"
          className="cm-search-input"
          placeholder="제목이나 내용으로 검색해보세요"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
        <button className="cm-search-btn" onClick={handleSearch}>🔍</button>
      </div>

      {/* ===== 3. 카테고리 탭 + 글쓰기 버튼 ===== */}
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
        <button className="cm-write-btn" onClick={() => {
          const user = localStorage.getItem('user');
          if (!user) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
          navigate('/community/write');
        }}>✏️ 글쓰기</button>
      </div>

      {/* ===== 3. 메인 영역: 게시글 목록 + 사이드바 ===== */}
      <div className="cm-content">

        {/* --- 왼쪽: 게시글 목록 --- */}
        <div className="cm-post-list">
          {/* 로딩 중이면 로딩 표시 */}
          {loading && <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>게시글을 불러오는 중...</p>}

          {/* 검색 중이면 검색 결과 안내 + 초기화 버튼 */}
          {searchKeyword && !loading && (
            <div className="cm-search-result">
              <span>"{searchKeyword}" 검색 결과 {filteredPosts.length}건</span>
              <button className="cm-search-clear" onClick={() => { setSearchInput(''); setSearchKeyword(''); }}>
                검색 초기화
              </button>
            </div>
          )}

          {/* 게시글이 없으면 안내 메시지 */}
          {!loading && filteredPosts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              {searchKeyword ? '검색 결과가 없어요. 다른 키워드로 검색해보세요!' : '아직 작성된 글이 없어요. 첫 글을 작성해보세요!'}
            </p>
          )}

          {filteredPosts.map((post) => (
            <div key={post.BOARD_NUM} className="cm-post-card" onClick={() => navigate(`/community/${post.BOARD_NUM}`)}>
              {/* 카드 상단: 카테고리 + 날짜 */}
              <div className="cm-post-top">
                <span
                  className="cm-post-category"
                  style={{ color: getCategoryColor(post.CATEGORY), backgroundColor: getCategoryColor(post.CATEGORY) + '15' }}
                >
                  {post.CATEGORY}
                </span>
                <span className="cm-post-date">{new Date(post.CREATED_TIME).toLocaleDateString('ko-KR')}</span>
              </div>

              {/* 제목 */}
              <h3 className="cm-post-title">{post.TITLE}</h3>

              {/* 내용 미리보기 (2줄까지) */}
              <p className="cm-post-content">{post.CONTENT}</p>

              {/* 이미지가 있으면 실제 사진 보여주기 */}
              {post.thumbnail && (
                <div className="cm-post-image">
                  <img
                    src={post.thumbnail.startsWith('http') ? post.thumbnail : `${BASE_URL}${post.thumbnail}`}
                    alt="게시글 사진"
                    className="cm-post-thumb"
                  />
                </div>
              )}

              {/* 하단: 작성자 + 좋아요/댓글/조회수 */}
              <div className="cm-post-footer">
                <span className="cm-post-author">{post.author}</span>
                <div className="cm-post-stats">
                  <span className="cm-stat">❤️ {post.likes}</span>
                  <span className="cm-stat">💬 {post.comments}</span>
                  <span className="cm-stat">👁 {post.VIEWS}</span>
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
                <div key={post.BOARD_NUM} className="cm-popular-item" onClick={() => navigate(`/community/${post.BOARD_NUM}`)} style={{ cursor: 'pointer' }}>
                  {/* 순위 번호 */}
                  <span className={`cm-popular-rank ${index < 3 ? 'top3' : ''}`}>
                    {index + 1}
                  </span>
                  {/* 제목 (1줄 말줄임) */}
                  <span className="cm-popular-name">{post.TITLE}</span>
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
