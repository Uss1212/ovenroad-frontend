/* ===================================================
   Events 컴포넌트 (이벤트 페이지)
   - DB에서 이벤트 목록을 가져와서 보여줌
   - 구성:
     1) 페이지 제목 + 설명
     2) 탭 (진행중 / 예정 / 종료)
     3) 진행중 이벤트: 큰 배너 카드 (상단 하이라이트)
     4) 이벤트 카드 그리드
     5) 각 카드: 이미지 + 제목 + 기간 + 상태 뱃지
   =================================================== */

import { useState, useEffect } from 'react';
import { getEventList } from '../../api/api';
import './Events.css';

export default function Events() {

  /* --- 상태(state) 관리 --- */

  /* 현재 선택한 탭 */
  const [activeTab, setActiveTab] = useState('진행중');

  /* DB에서 가져온 이벤트 목록 */
  const [events, setEvents] = useState([]);

  /* 로딩 상태 */
  const [loading, setLoading] = useState(true);

  /* --- 탭 목록 --- */
  const tabs = ['진행중', '예정', '종료'];

  /* --- 이벤트 데이터 불러오기 --- */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEventList();
        setEvents(data);
      } catch (err) {
        console.error('이벤트 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  /* --- 탭에 따라 이벤트 필터링 --- */
  const filteredEvents = events.filter((e) => e.status === activeTab);

  /* --- 하이라이트 이벤트 (진행중 탭일 때 첫 번째 이벤트) --- */
  const highlightEvent = activeTab === '진행중' && filteredEvents.length > 0
    ? filteredEvents[0]
    : null;

  /* --- 일반 이벤트 (하이라이트 제외) --- */
  const normalEvents = highlightEvent
    ? filteredEvents.slice(1)
    : filteredEvents;

  /* --- 날짜 포맷 (YYYY.MM.DD) --- */
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

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

      {/* ===== 3. 로딩 중 ===== */}
      {loading ? (
        <div className="ev-empty">
          <p className="ev-empty-title">불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* ===== 4. 하이라이트 이벤트 (진행중일 때만) ===== */}
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
                  <h2 className="ev-highlight-title">{highlightEvent.TITLE}</h2>
                  <p className="ev-highlight-desc">{highlightEvent.DESCRIPTION}</p>
                  <div className="ev-highlight-meta">
                    <span>📅 {formatDate(highlightEvent.START_DATE)} ~ {formatDate(highlightEvent.END_DATE)}</span>
                    {highlightEvent.REWARD && <span>🎁 {highlightEvent.REWARD}</span>}
                  </div>
                  <button className="ev-participate-btn">이벤트 참여하기</button>
                </div>
                {/* 오른쪽: 이미지 */}
                <div className="ev-highlight-image">
                  {highlightEvent.IMAGE ? (
                    <img src={highlightEvent.IMAGE} alt={highlightEvent.TITLE} />
                  ) : (
                    <span>🎉</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== 5. 이벤트 카드 그리드 ===== */}
          {normalEvents.length > 0 ? (
            <div className="ev-grid">
              {normalEvents.map((event) => (
                <div key={event.EVENT_NUM} className="ev-card">
                  {/* 카드 상단: 이미지 */}
                  <div className="ev-card-image">
                    {event.IMAGE ? (
                      <img src={event.IMAGE} alt={event.TITLE} />
                    ) : (
                      <span>🎉</span>
                    )}
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
                    <h3 className="ev-card-title">{event.TITLE}</h3>

                    {/* 설명 (2줄) */}
                    <p className="ev-card-desc">{event.DESCRIPTION}</p>

                    {/* 기간 */}
                    <div className="ev-card-meta">
                      <span className="ev-card-date">
                        📅 {formatDate(event.START_DATE)} ~ {formatDate(event.END_DATE)}
                      </span>
                    </div>

                    {/* 보상 */}
                    {event.REWARD && (
                      <div className="ev-card-reward">
                        🎁 {event.REWARD}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 해당 탭에 이벤트가 없을 때 */
            !highlightEvent && (
              <div className="ev-empty">
                <span className="ev-empty-icon">📭</span>
                <p className="ev-empty-title">해당 이벤트가 없습니다</p>
                <p className="ev-empty-desc">새로운 이벤트를 기대해주세요!</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
