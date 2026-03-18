/* ===================================================
   NoticeDetail 컴포넌트 (공지사항 상세 페이지)
   - 공지사항 목록에서 클릭하면 보이는 상세 페이지
   - 구성:
     1) 뒤로가기 + 목록으로 버튼
     2) 공지 카테고리 + 날짜
     3) 공지 제목
     4) 공지 본문 내용
     5) 이전글 / 다음글 네비게이션
     6) 목록으로 돌아가기 버튼
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NoticeDetail.css';

export default function NoticeDetail() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 공지사항 목록 더미 데이터 --- */
  /* 나중에 백엔드 API에서 받아올 예정 */
  const notices = [
    {
      id: 1,
      category: '서비스',
      title: '빵지순례 앱 v2.0 업데이트 안내',
      date: '2025.12.27',
      content: `안녕하세요, 빵지순례 팀입니다.

빵지순례 앱이 v2.0으로 대규모 업데이트되었습니다! 🎉

■ 주요 업데이트 내용

1. 코스 만들기 기능 개선
- 장소 검색이 더 빠르고 정확해졌어요
- 지도 미리보기에서 실시간으로 경로를 확인할 수 있어요
- 코스 설명에 사진을 추가할 수 있어요

2. 빵지도 리뉴얼
- 지도 위에서 빵집을 한눈에 볼 수 있어요
- 지역별, 카테고리별 필터 기능이 추가되었어요
- 빵집 정보를 더 자세하게 볼 수 있어요

3. 커뮤니티 오픈
- 빵순이들과 자유롭게 소통할 수 있는 커뮤니티가 오픈되었어요
- 후기, 질문, 꿀팁 등 다양한 카테고리로 글을 작성할 수 있어요

4. 성능 개선
- 앱 로딩 속도가 50% 빨라졌어요
- 이미지 로딩이 개선되었어요

업데이트 후 문제가 있으시면 고객센터로 연락해주세요.
감사합니다.`,
      views: 1523,
    },
    {
      id: 2,
      category: '이벤트',
      title: '크리스마스 빵지순례 스탬프 투어 안내',
      date: '2025.12.20',
      content: `안녕하세요, 빵지순례 팀입니다.

12월 한 달간 특별한 크리스마스 스탬프 투어를 진행합니다! 🎄

■ 이벤트 기간
2025.12.01 ~ 2025.12.31

■ 참여 방법
1. 앱에서 "크리스마스 스탬프 투어" 이벤트에 참여하기
2. 지정된 빵집 5곳을 방문하고 인증하기
3. 스탬프 5개를 모으면 자동으로 응모 완료!

■ 경품
- 1등 (1명): 빵집 투어 상품권 10만원
- 2등 (5명): 빵 모양 키링 세트
- 3등 (20명): 빵지순례 에코백

많은 참여 부탁드립니다!`,
      views: 2341,
    },
    {
      id: 3,
      category: '안내',
      title: '개인정보 처리방침 변경 안내',
      date: '2025.12.15',
      content: `안녕하세요, 빵지순례 팀입니다.

개인정보 처리방침이 아래와 같이 변경됨을 안내드립니다.

■ 변경 시행일: 2026.01.01

■ 주요 변경 사항
1. 수집하는 개인정보 항목에 "위치정보"가 추가됩니다.
   - 빵지도 기능 이용 시 현재 위치를 기반으로 주변 빵집을 안내하기 위함입니다.
   - 위치정보 수집은 사용자의 동의 하에만 진행됩니다.

2. 개인정보 보유 기간이 변경됩니다.
   - 회원 탈퇴 후 30일 → 14일 이내 파기

변경된 개인정보 처리방침은 시행일부터 적용됩니다.
자세한 내용은 설정 > 개인정보 처리방침에서 확인하실 수 있습니다.

감사합니다.`,
      views: 876,
    },
    {
      id: 4,
      category: '점검',
      title: '서버 점검 안내 (12/10 02:00~06:00)',
      date: '2025.12.08',
      content: `안녕하세요, 빵지순례 팀입니다.

서비스 안정성 향상을 위해 아래와 같이 서버 점검을 진행합니다.

■ 점검 일시
2025.12.10 (화) 02:00 ~ 06:00 (약 4시간)

■ 점검 영향
- 점검 시간 동안 앱 이용이 제한됩니다.
- 코스 저장, 댓글 작성 등 데이터 입력이 불가합니다.

■ 점검 목적
- 서버 인프라 업그레이드
- 데이터베이스 최적화

이용에 불편을 드려 죄송합니다.
점검이 빨리 끝나면 조기 오픈하겠습니다.

감사합니다.`,
      views: 654,
    },
  ];

  /* --- 현재 보고 있는 공지사항 인덱스 --- */
  const [currentIndex, setCurrentIndex] = useState(0);

  /* --- 현재 공지사항 --- */
  const notice = notices[currentIndex];

  /* --- 이전글 / 다음글 --- */
  const prevNotice = currentIndex < notices.length - 1 ? notices[currentIndex + 1] : null;
  const nextNotice = currentIndex > 0 ? notices[currentIndex - 1] : null;

  /* --- 카테고리별 색상 --- */
  const getCategoryColor = (category) => {
    const colors = {
      '서비스': '#3b82f6',
      '이벤트': '#f59e0b',
      '안내': '#8b5cf6',
      '점검': '#ef4444',
    };
    return colors[category] || '#888888';
  };

  return (
    <div className="notice-detail">

      {/* ===== 1. 상단 네비게이션 ===== */}
      <div className="nd-nav">
        <button className="nd-back-btn" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
      </div>

      {/* ===== 2. 공지 헤더 ===== */}
      <div className="nd-header">
        {/* 카테고리 뱃지 */}
        <span
          className="nd-category"
          style={{
            color: getCategoryColor(notice.category),
            backgroundColor: getCategoryColor(notice.category) + '15',
          }}
        >
          {notice.category}
        </span>

        {/* 제목 */}
        <h1 className="nd-title">{notice.title}</h1>

        {/* 날짜 + 조회수 */}
        <div className="nd-meta">
          <span className="nd-date">📅 {notice.date}</span>
          <span className="nd-views">👁 조회 {notice.views.toLocaleString()}</span>
        </div>
      </div>

      {/* ===== 3. 공지 본문 ===== */}
      <div className="nd-content">
        {/* 본문 내용을 줄바꿈 유지하며 표시 */}
        {notice.content.split('\n').map((line, i) => (
          <p key={i} className={line.startsWith('■') ? 'nd-section-title' : ''}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>

      {/* ===== 4. 이전글 / 다음글 네비게이션 ===== */}
      <div className="nd-post-nav">
        {/* 다음글 (더 최신 글) */}
        {nextNotice ? (
          <div
            className="nd-post-nav-item"
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            <span className="nd-post-nav-label">▲ 다음글</span>
            <span className="nd-post-nav-title">{nextNotice.title}</span>
            <span className="nd-post-nav-date">{nextNotice.date}</span>
          </div>
        ) : (
          <div className="nd-post-nav-item nd-post-nav-empty">
            <span className="nd-post-nav-label">▲ 다음글</span>
            <span className="nd-post-nav-title">다음글이 없습니다</span>
          </div>
        )}

        {/* 이전글 (더 오래된 글) */}
        {prevNotice ? (
          <div
            className="nd-post-nav-item"
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            <span className="nd-post-nav-label">▼ 이전글</span>
            <span className="nd-post-nav-title">{prevNotice.title}</span>
            <span className="nd-post-nav-date">{prevNotice.date}</span>
          </div>
        ) : (
          <div className="nd-post-nav-item nd-post-nav-empty">
            <span className="nd-post-nav-label">▼ 이전글</span>
            <span className="nd-post-nav-title">이전글이 없습니다</span>
          </div>
        )}
      </div>

      {/* ===== 5. 목록으로 버튼 ===== */}
      <div className="nd-list-btn-wrap">
        {/* 클릭하면 공지사항 목록 페이지(/notice)로 이동 */}
        <button className="nd-list-btn" onClick={() => navigate('/notice')}>
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
