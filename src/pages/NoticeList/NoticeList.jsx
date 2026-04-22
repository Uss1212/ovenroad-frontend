/* ===================================================
   NoticeList 컴포넌트 (공지사항 목록 페이지)
   - DB에서 모든 공지사항을 가져와서 보여줌
   - 각 공지를 클릭하면 상세 페이지(/notice/:id)로 이동
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNoticeList } from '../../api/apiAxios';
import './NoticeList.css';

export default function NoticeList() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 공지사항 데이터 (DB에서 가져옴) --- */
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  /* --- 공지사항 불러오기 --- */
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await getNoticeList();
        setNotices(data);
      } catch (err) {
        console.error('공지사항 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="notice-list-page">

      {/* ===== 1. 페이지 헤더 ===== */}
      <div className="nl-header">
        <h1 className="nl-title">공지사항</h1>
        <p className="nl-subtitle">오븐로드의 새로운 소식을 확인해보세요</p>
      </div>

      {/* ===== 2. 공지사항 목록 ===== */}
      <div className="nl-list">
        {loading ? (
          <div className="nl-empty">
            <p>불러오는 중...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="nl-empty">
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.NOTICE_NUM}
              className="nl-item"
              onClick={() => navigate(`/notice/${notice.NOTICE_NUM}`)}
            >
              {/* 왼쪽: 아이콘 */}
              <div className="nl-item-left">
                <span className="nl-category" style={{ color: '#3b82f6', backgroundColor: '#3b82f615' }}>
                  공지
                </span>
              </div>

              {/* 가운데: 제목 + 미리보기 */}
              <div className="nl-item-body">
                <h3 className="nl-item-title">{notice.TITLE}</h3>
                <p className="nl-item-preview">{notice.author}</p>
              </div>

              {/* 오른쪽: 날짜 */}
              <div className="nl-item-right">
                <span className="nl-item-date">
                  {new Date(notice.CREATED_TIME).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
