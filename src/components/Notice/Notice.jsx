/* ===================================================
   Notice 컴포넌트 (공지사항 위젯)
   - 메인 페이지 하단에 위치
   - DB에서 최신 공지 4개를 가져와서 보여줌
   - "View more"를 누르면 공지사항 목록 페이지로 이동
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNoticeList } from '../../api/apiAxios';
import './Notice.css';

export default function Notice() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 공지사항 데이터 (DB에서 가져옴) --- */
  const [notices, setNotices] = useState([]);

  /* --- 공지사항 불러오기 --- */
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await getNoticeList();
        setNotices(data.slice(0, 4));  /* 최신 4개만 표시 */
      } catch (err) {
        console.error('공지사항 불러오기 실패:', err);
      }
    };
    fetchNotices();
  }, []);

  return (
    <section className="notice">

      {/* ===== 상단: 제목 + View more ===== */}
      <div className="notice-header">
        <h2 className="notice-title">공지사항</h2>
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
        {notices.length === 0 ? (
          <li className="notice-item" style={{ justifyContent: 'center', color: '#999' }}>
            등록된 공지사항이 없습니다.
          </li>
        ) : (
          notices.map((notice) => (
            <li
              key={notice.NOTICE_NUM}
              className="notice-item"
              onClick={() => navigate(`/notice/${notice.NOTICE_NUM}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="notice-item-img">
                <span>📢</span>
              </div>
              <p className="notice-item-title">{notice.TITLE}</p>
              <span className="notice-item-date">
                {new Date(notice.CREATED_TIME).toLocaleDateString('ko-KR')}
              </span>
            </li>
          ))
        )}
      </ul>

    </section>
  );
}
