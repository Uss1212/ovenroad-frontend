/* ===================================================
   Events 컴포넌트 (이벤트 페이지)
   - 빵지순례 관련 이벤트/프로모션을 보여주는 페이지
   - 구성:
     1) 페이지 제목 + 설명
     2) 탭 (진행중 / 예정 / 종료)
     3) 진행중 이벤트: 큰 배너 카드 (상단 하이라이트)
     4) 이벤트 카드 그리드
     5) 각 카드: 이미지 + 제목 + 기간 + 상태 뱃지
   =================================================== */

import { useState } from 'react';
import './Events.css';

export default function Events() {

  /* --- 상태(state) 관리 --- */

  /* 현재 선택한 탭 */
  const [activeTab, setActiveTab] = useState('진행중');

  /* --- 탭 목록 --- */
  const tabs = ['진행중', '예정', '종료'];

  /* --- 이벤트 더미 데이터 --- */
  /* 나중에 백엔드 API에서 받아올 예정 */
  const events = [
    {
      id: 1,
      title: '🎄 크리스마스 빵지순례 스탬프 투어',
      description: '12월 한 달간 지정 빵집 5곳을 방문하고 스탬프를 모으면 특별 굿즈를 드려요! 빵 모양 키링, 에코백 등 한정판 굿즈를 놓치지 마세요.',
      image: '🎄',
      startDate: '2025.12.01',
      endDate: '2025.12.31',
      status: '진행중',
      dday: 'D-4',
      participants: 1247,
      reward: '빵 모양 키링 + 에코백',
      highlight: true,
    },
    {
      id: 2,
      title: '📸 나의 빵지순례 인증샷 콘테스트',
      description: '빵지순례 코스를 돌며 찍은 인증샷을 올려주세요. 가장 맛있어 보이는 사진 TOP 10에게 빵집 상품권을 드립니다!',
      image: '📸',
      startDate: '2025.12.15',
      endDate: '2026.01.15',
      status: '진행중',
      dday: 'D-29',
      participants: 583,
      reward: '빵집 상품권 5만원',
      highlight: false,
    },
    {
      id: 3,
      title: '🏆 이달의 베스트 코스 선정',
      description: '매달 가장 인기 있는 코스를 선정하여 코스 제작자에게 특별 혜택을 드려요. 12월 베스트 코스에 도전해보세요!',
      image: '🏆',
      startDate: '2025.12.01',
      endDate: '2025.12.31',
      status: '진행중',
      dday: 'D-4',
      participants: 312,
      reward: '프리미엄 배지 + 빵집 상품권 3만원',
      highlight: false,
    },
    {
      id: 4,
      title: '🎁 신년 빵 복주머니 이벤트',
      description: '2026년 새해를 맞아 앱 접속만 해도 랜덤 빵 쿠폰을 드려요! 매일 접속하면 더 큰 쿠폰이 나올 수도?!',
      image: '🎁',
      startDate: '2026.01.01',
      endDate: '2026.01.07',
      status: '예정',
      dday: '시작까지 D-5',
      participants: 0,
      reward: '랜덤 빵 할인 쿠폰',
      highlight: false,
    },
    {
      id: 5,
      title: '🗺️ 2026 빵지도 완성 프로젝트',
      description: '아직 등록되지 않은 숨은 빵집을 제보해주세요. 제보 건수에 따라 빵 탐험가 뱃지를 드려요!',
      image: '🗺️',
      startDate: '2026.01.10',
      endDate: '2026.02.28',
      status: '예정',
      dday: '시작까지 D-14',
      participants: 0,
      reward: '빵 탐험가 뱃지 + 포인트',
      highlight: false,
    },
    {
      id: 6,
      title: '🍂 가을 빵 페스티벌 후기 이벤트',
      description: '가을 빵 페스티벌에 참여하고 후기를 남겨주신 분들께 추첨을 통해 선물을 드렸어요. 당첨자 확인!',
      image: '🍂',
      startDate: '2025.10.01',
      endDate: '2025.10.31',
      status: '종료',
      dday: '종료',
      participants: 2156,
      reward: '빵집 이용권 세트',
      highlight: false,
    },
    {
      id: 7,
      title: '🎃 할로윈 빵 코스튬 이벤트',
      description: '할로윈 테마 빵을 먹고 인증하면 할로윈 한정 뱃지를 드렸어요. 총 1,500명이 참여했습니다!',
      image: '🎃',
      startDate: '2025.10.25',
      endDate: '2025.11.03',
      status: '종료',
      dday: '종료',
      participants: 1523,
      reward: '할로윈 한정 뱃지',
      highlight: false,
    },
  ];

  /* --- 탭에 따라 이벤트 필터링 --- */
  const filteredEvents = events.filter((e) => e.status === activeTab);

  /* --- 하이라이트 이벤트 (진행중 탭일 때만) --- */
  const highlightEvent = activeTab === '진행중'
    ? filteredEvents.find((e) => e.highlight)
    : null;

  /* --- 일반 이벤트 (하이라이트 제외) --- */
  const normalEvents = highlightEvent
    ? filteredEvents.filter((e) => !e.highlight)
    : filteredEvents;

  /* --- 상태 뱃지 색상 --- */
  const getStatusStyle = (status) => {
    if (status === '진행중') return { background: '#22c55e', color: '#ffffff' };
    if (status === '예정') return { background: '#3b82f6', color: '#ffffff' };
    return { background: '#e0e0e0', color: '#888888' };
  };

  return (
    <div className="events">

      {/* ===== 1. 페이지 헤더 ===== */}
      <div className="ev-header">
        <h1 className="ev-title">이벤트</h1>
        <p className="ev-subtitle">빵지순례와 함께하는 다양한 이벤트에 참여해보세요</p>
      </div>

      {/* ===== 2. 탭 ===== */}
      <div className="ev-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`ev-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {/* 각 탭의 이벤트 개수 표시 */}
            <span className="ev-tab-count">
              {events.filter((e) => e.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* ===== 3. 하이라이트 이벤트 (진행중일 때만) ===== */}
      {highlightEvent && (
        <div className="ev-highlight">
          {/* 하이라이트 카드: 큰 배너 형태 */}
          <div className="ev-highlight-card">
            {/* 왼쪽: 이벤트 정보 */}
            <div className="ev-highlight-info">
              <div className="ev-highlight-badges">
                <span className="ev-status-badge" style={getStatusStyle('진행중')}>
                  진행중
                </span>
                <span className="ev-dday-badge">{highlightEvent.dday}</span>
              </div>
              <h2 className="ev-highlight-title">{highlightEvent.title}</h2>
              <p className="ev-highlight-desc">{highlightEvent.description}</p>
              <div className="ev-highlight-meta">
                <span>📅 {highlightEvent.startDate} ~ {highlightEvent.endDate}</span>
                <span>👥 {highlightEvent.participants.toLocaleString()}명 참여</span>
                <span>🎁 {highlightEvent.reward}</span>
              </div>
              <button className="ev-participate-btn">이벤트 참여하기</button>
            </div>
            {/* 오른쪽: 이미지 (임시) */}
            <div className="ev-highlight-image">
              <span>{highlightEvent.image}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== 4. 이벤트 카드 그리드 ===== */}
      {normalEvents.length > 0 ? (
        <div className="ev-grid">
          {normalEvents.map((event) => (
            <div key={event.id} className="ev-card">
              {/* 카드 상단: 이미지 (임시) */}
              <div className="ev-card-image">
                <span>{event.image}</span>
                {/* 상태 뱃지 */}
                <span className="ev-card-status" style={getStatusStyle(event.status)}>
                  {event.status}
                </span>
              </div>

              {/* 카드 하단: 정보 */}
              <div className="ev-card-body">
                {/* D-day */}
                <span className="ev-card-dday">{event.dday}</span>

                {/* 제목 */}
                <h3 className="ev-card-title">{event.title}</h3>

                {/* 설명 (2줄) */}
                <p className="ev-card-desc">{event.description}</p>

                {/* 기간 + 참여자 */}
                <div className="ev-card-meta">
                  <span className="ev-card-date">
                    📅 {event.startDate} ~ {event.endDate}
                  </span>
                  {event.participants > 0 && (
                    <span className="ev-card-participants">
                      👥 {event.participants.toLocaleString()}명
                    </span>
                  )}
                </div>

                {/* 보상 */}
                <div className="ev-card-reward">
                  🎁 {event.reward}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 이벤트가 없을 때 */
        <div className="ev-empty">
          <span className="ev-empty-icon">📭</span>
          <p className="ev-empty-title">해당 이벤트가 없습니다</p>
          <p className="ev-empty-desc">새로운 이벤트를 기대해주세요!</p>
        </div>
      )}
    </div>
  );
}
