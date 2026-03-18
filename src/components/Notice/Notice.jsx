/* ===================================================
   Notice 컴포넌트 (공지사항)
   - 메인 페이지 하단에 위치
   - "공지사항" 제목 + View more 링크
   - 공지사항 목록: 각 항목에 작은 이미지 + 제목 + 날짜
   - 최신 공지 4~5개를 보여줌
   =================================================== */

import { useNavigate } from 'react-router-dom';
import './Notice.css';

export default function Notice() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 공지사항 더미 데이터 --- */
  // 나중에 백엔드 API(NOTICE 테이블)에서 받아올 데이터
  // 지금은 가짜 데이터로 화면을 먼저 만듦
  const notices = [
    {
      id: 1,
      title: '오븐로드 서비스 오픈 안내',
      date: '2026.03.15',
      image: null,  // 나중에 실제 이미지 URL
    },
    {
      id: 2,
      title: '3월 이벤트: 빵지순례 스탬프 투어',
      date: '2026.03.12',
      image: null,
    },
    {
      id: 3,
      title: '신규 지역 추가 안내 (성동구, 강남구)',
      date: '2026.03.10',
      image: null,
    },
    {
      id: 4,
      title: '개인정보 처리방침 변경 안내',
      date: '2026.03.05',
      image: null,
    },
  ];

  return (
    <section className="notice">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="notice-header">
        <h2 className="notice-title">공지사항</h2>
        {/* 더보기 링크: 클릭하면 공지사항 목록 페이지(/notice)로 이동 */}
        <a
          href="/notice"
          className="notice-more"
          onClick={(e) => {
            e.preventDefault();
            navigate('/notice');
          }}
        >
          View more →
        </a>
      </div>

      {/* ===== 공지사항 목록 ===== */}
      <ul className="notice-list">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="notice-item"
            onClick={() => navigate(`/notice/${notice.id}`)}
            style={{ cursor: 'pointer' }}
          >

            {/* 왼쪽: 공지 썸네일 이미지 */}
            <div className="notice-item-img">
              <span>📢</span>
            </div>

            {/* 가운데: 공지 제목 */}
            <p className="notice-item-title">{notice.title}</p>

            {/* 오른쪽: 작성 날짜 */}
            <span className="notice-item-date">{notice.date}</span>

          </li>
        ))}
      </ul>

    </section>
  );
}
