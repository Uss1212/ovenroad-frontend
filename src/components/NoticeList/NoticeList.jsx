/* ===================================================
   NoticeList 컴포넌트 (공지사항 목록 페이지)
   - 모든 공지사항을 한눈에 볼 수 있는 전체 목록 페이지
   - 구성:
     1) 페이지 제목 + 설명
     2) 카테고리 필터 탭 (전체, 서비스, 이벤트, 안내, 점검)
     3) 공지사항 목록 (카드형)
     4) 각 공지를 클릭하면 상세 페이지(/notice/:id)로 이동
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NoticeList.css';

export default function NoticeList() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 현재 선택한 카테고리 탭 --- */
  const [activeTab, setActiveTab] = useState('전체');

  /* --- 카테고리 탭 목록 --- */
  /* 각 탭에 아이콘과 이름이 있음 */
  const tabs = [
    { name: '전체', icon: '📋' },
    { name: '서비스', icon: '🔧' },
    { name: '이벤트', icon: '🎉' },
    { name: '안내', icon: '📢' },
    { name: '점검', icon: '⚙️' },
  ];

  /* --- 공지사항 더미 데이터 --- */
  /* 나중에 백엔드 API(NOTICE 테이블)에서 받아올 예정 */
  /* NoticeDetail.jsx와 같은 데이터를 사용 (나중에 API로 통합) */
  const notices = [
    {
      id: 1,
      category: '서비스',
      title: '빵지순례 앱 v2.0 업데이트 안내',
      date: '2025.12.27',
      /* 본문 미리보기: 긴 내용 중 앞부분만 잘라서 보여줌 */
      preview: '빵지순례 앱이 v2.0으로 대규모 업데이트되었습니다! 코스 만들기 기능 개선, 빵지도 리뉴얼, 커뮤니티 오픈 등...',
      views: 1523,
      /* 중요 공지인지 여부 (상단 고정용) */
      isPinned: true,
    },
    {
      id: 2,
      category: '이벤트',
      title: '크리스마스 빵지순례 스탬프 투어 안내',
      date: '2025.12.20',
      preview: '12월 한 달간 특별한 크리스마스 스탬프 투어를 진행합니다! 지정된 빵집 5곳을 방문하고 스탬프를 모아보세요.',
      views: 2341,
      isPinned: true,
    },
    {
      id: 3,
      category: '안내',
      title: '개인정보 처리방침 변경 안내',
      date: '2025.12.15',
      preview: '개인정보 처리방침이 변경됩니다. 수집하는 개인정보 항목에 "위치정보"가 추가되며, 보유 기간이 변경됩니다.',
      views: 876,
      isPinned: false,
    },
    {
      id: 4,
      category: '점검',
      title: '서버 점검 안내 (12/10 02:00~06:00)',
      date: '2025.12.08',
      preview: '서비스 안정성 향상을 위해 서버 점검을 진행합니다. 점검 시간 동안 앱 이용이 제한됩니다.',
      views: 654,
      isPinned: false,
    },
    {
      id: 5,
      category: '서비스',
      title: '빵지도 신규 지역 추가 안내 (성동구, 강남구)',
      date: '2025.12.01',
      preview: '빵지도에 성동구와 강남구 지역이 새롭게 추가되었습니다. 총 150개 이상의 빵집 정보를 확인해보세요!',
      views: 1102,
      isPinned: false,
    },
    {
      id: 6,
      category: '이벤트',
      title: '빵지순례 앱 출시 기념 이벤트',
      date: '2025.11.25',
      preview: '빵지순례 앱 출시를 기념하여 특별 이벤트를 진행합니다. 앱 다운로드 후 리뷰를 남겨주시면 추첨을 통해 상품을 드립니다.',
      views: 3456,
      isPinned: false,
    },
    {
      id: 7,
      category: '안내',
      title: '커뮤니티 이용 가이드',
      date: '2025.11.20',
      preview: '커뮤니티를 더 즐겁게 이용하는 방법을 안내합니다. 카테고리별 작성 가이드와 주의사항을 확인해주세요.',
      views: 987,
      isPinned: false,
    },
    {
      id: 8,
      category: '점검',
      title: '정기 점검 안내 (11/15 03:00~05:00)',
      date: '2025.11.12',
      preview: '정기 서버 점검을 진행합니다. 점검 시간 동안 일부 기능 이용이 제한될 수 있습니다.',
      views: 432,
      isPinned: false,
    },
  ];

  /* --- 카테고리별 색상 --- */
  /* 카테고리마다 다른 색상을 사용해서 한눈에 구분 가능 */
  const getCategoryColor = (category) => {
    const colors = {
      '서비스': '#3b82f6',   /* 파란색 */
      '이벤트': '#f59e0b',   /* 주황색 */
      '안내': '#8b5cf6',     /* 보라색 */
      '점검': '#ef4444',     /* 빨간색 */
    };
    return colors[category] || '#888888';
  };

  /* --- 카테고리 필터링 --- */
  /* "전체"를 선택하면 모든 공지 표시, 특정 카테고리 선택하면 그것만 표시 */
  const filteredNotices = activeTab === '전체'
    ? notices
    : notices.filter((n) => n.category === activeTab);

  /* --- 고정 공지와 일반 공지 분리 --- */
  /* isPinned가 true인 공지는 항상 상단에 표시 */
  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const normalNotices = filteredNotices.filter((n) => !n.isPinned);

  return (
    <div className="notice-list-page">

      {/* ===== 1. 페이지 헤더 ===== */}
      <div className="nl-header">
        <h1 className="nl-title">공지사항</h1>
        <p className="nl-subtitle">빵지순례의 새로운 소식을 확인해보세요</p>
      </div>

      {/* ===== 2. 카테고리 필터 탭 ===== */}
      <div className="nl-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`nl-tab ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.name)}
          >
            <span className="nl-tab-icon">{tab.icon}</span>
            <span className="nl-tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* ===== 3. 공지사항 목록 ===== */}
      <div className="nl-list">

        {/* --- 고정 공지 (상단 고정) --- */}
        {pinnedNotices.map((notice) => (
          <div
            key={notice.id}
            className="nl-item nl-item-pinned"
            onClick={() => navigate(`/notice/${notice.id}`)}
          >
            {/* 왼쪽: 고정 아이콘 + 카테고리 */}
            <div className="nl-item-left">
              {/* 📌 고정 표시 */}
              <span className="nl-pin">📌</span>
              {/* 카테고리 뱃지 */}
              <span
                className="nl-category"
                style={{
                  color: getCategoryColor(notice.category),
                  backgroundColor: getCategoryColor(notice.category) + '15',
                }}
              >
                {notice.category}
              </span>
            </div>

            {/* 가운데: 제목 + 미리보기 */}
            <div className="nl-item-body">
              <h3 className="nl-item-title">{notice.title}</h3>
              <p className="nl-item-preview">{notice.preview}</p>
            </div>

            {/* 오른쪽: 날짜 + 조회수 */}
            <div className="nl-item-right">
              <span className="nl-item-date">{notice.date}</span>
              <span className="nl-item-views">👁 {notice.views.toLocaleString()}</span>
            </div>
          </div>
        ))}

        {/* --- 일반 공지 --- */}
        {normalNotices.map((notice) => (
          <div
            key={notice.id}
            className="nl-item"
            onClick={() => navigate(`/notice/${notice.id}`)}
          >
            {/* 왼쪽: 카테고리 */}
            <div className="nl-item-left">
              {/* 카테고리 뱃지 */}
              <span
                className="nl-category"
                style={{
                  color: getCategoryColor(notice.category),
                  backgroundColor: getCategoryColor(notice.category) + '15',
                }}
              >
                {notice.category}
              </span>
            </div>

            {/* 가운데: 제목 + 미리보기 */}
            <div className="nl-item-body">
              <h3 className="nl-item-title">{notice.title}</h3>
              <p className="nl-item-preview">{notice.preview}</p>
            </div>

            {/* 오른쪽: 날짜 + 조회수 */}
            <div className="nl-item-right">
              <span className="nl-item-date">{notice.date}</span>
              <span className="nl-item-views">👁 {notice.views.toLocaleString()}</span>
            </div>
          </div>
        ))}

        {/* --- 필터 결과가 없을 때 --- */}
        {filteredNotices.length === 0 && (
          <div className="nl-empty">
            <p>해당 카테고리의 공지사항이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
