/* ===================================================
   NoticeDetail 컴포넌트 (공지사항 상세 페이지)
   - DB에서 공지사항 1개를 가져와서 보여줌
   - 이전글/다음글 네비게이션 포함
   =================================================== */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNoticeDetail } from '../../api/api';
import './NoticeDetail.css';

export default function NoticeDetail() {

  /* --- URL에서 공지 번호 가져오기 --- */
  const { id } = useParams();

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태 관리 --- */
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  /* --- 공지사항 데이터 불러오기 --- */
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setLoading(true);
        const data = await getNoticeDetail(id);
        setNotice(data);
      } catch (err) {
        console.error('공지사항 불러오기 실패:', err);
        setNotice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  /* --- 로딩 중 --- */
  if (loading) {
    return (
      <div className="notice-detail">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
          불러오는 중...
        </div>
      </div>
    );
  }

  /* --- 공지를 찾지 못했을 때 --- */
  if (!notice) {
    return (
      <div className="notice-detail">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
          <p>공지사항을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/notice')}
            style={{ marginTop: '16px', padding: '10px 20px', cursor: 'pointer' }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
        <span className="nd-category" style={{ color: '#3b82f6', backgroundColor: '#3b82f615' }}>
          공지
        </span>
        <h1 className="nd-title">{notice.TITLE}</h1>
        <div className="nd-meta">
          <span className="nd-date">📅 {new Date(notice.CREATED_TIME).toLocaleDateString('ko-KR')}</span>
          <span className="nd-views">✍ {notice.author}</span>
        </div>
      </div>

      {/* ===== 3. 공지 본문 ===== */}
      <div className="nd-content">
        {(notice.CONTENT || '').split('\n').map((line, i) => (
          <p key={i} className={line.startsWith('■') ? 'nd-section-title' : ''}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>

      {/* ===== 4. 이전글 / 다음글 네비게이션 ===== */}
      <div className="nd-post-nav">
        {/* 다음글 (더 최신 글) */}
        {notice.nextNotice ? (
          <div
            className="nd-post-nav-item"
            onClick={() => navigate(`/notice/${notice.nextNotice.NOTICE_NUM}`)}
          >
            <span className="nd-post-nav-label">▲ 다음글</span>
            <span className="nd-post-nav-title">{notice.nextNotice.TITLE}</span>
          </div>
        ) : (
          <div className="nd-post-nav-item nd-post-nav-empty">
            <span className="nd-post-nav-label">▲ 다음글</span>
            <span className="nd-post-nav-title">다음글이 없습니다</span>
          </div>
        )}

        {/* 이전글 (더 오래된 글) */}
        {notice.prevNotice ? (
          <div
            className="nd-post-nav-item"
            onClick={() => navigate(`/notice/${notice.prevNotice.NOTICE_NUM}`)}
          >
            <span className="nd-post-nav-label">▼ 이전글</span>
            <span className="nd-post-nav-title">{notice.prevNotice.TITLE}</span>
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
        <button className="nd-list-btn" onClick={() => navigate('/notice')}>
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
