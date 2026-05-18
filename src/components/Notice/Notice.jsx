import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNoticeList, getFaqList, getQuestionList } from '../../api/apiAxios';
import './Notice.css';

export default function Notice() {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('notice');
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    getNoticeList().then(data => setNotices(data.slice(0, 3))).catch(() => {});
    getFaqList().then(data => setFaqs(data.slice(0, 3))).catch(() => {});
    const saved = localStorage.getItem('user');
    if (saved) {
      const u = JSON.parse(saved);
      getQuestionList(u.userNum).then(data => setQuestions(data.slice(0, 3))).catch(() => {});
    }
  }, []);

  return (
    <section className="notice">

      <div className="notice-header">
        <h2 className="notice-title">고객지원</h2>
        <div className="notice-header-links">
          <button
            className={`notice-tab-link ${activeTab === 'notice' ? 'active' : ''}`}
            onClick={() => setActiveTab('notice')}
          >
            공지사항
          </button>
          <button
            className={`notice-tab-link ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
          <button
            className={`notice-tab-link ${activeTab === 'qna' ? 'active' : ''}`}
            onClick={() => setActiveTab('qna')}
          >
            문의하기
          </button>
        </div>
      </div>

      {activeTab === 'notice' && (
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
          <li className="notice-item notice-viewmore" onClick={() => navigate('/notice')} style={{ cursor: 'pointer', justifyContent: 'center' }}>
            <span style={{ color: '#999', fontSize: '13px' }}>더보기 →</span>
          </li>
        </ul>
      )}

      {activeTab === 'faq' && (
        <ul className="notice-list">
          {faqs.length === 0 ? (
            <li className="notice-item" style={{ justifyContent: 'center', color: '#999' }}>
              등록된 FAQ가 없습니다.
            </li>
          ) : (
            faqs.map((faq) => (
              <li
                key={faq.FAQ_NUM}
                className="notice-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/notice?tab=faq')}
              >
                <div className="notice-item-img">
                  <span>❓</span>
                </div>
                <p className="notice-item-title">{faq.FAQ_QUESTION || faq.QUESTION}</p>
              </li>
            ))
          )}
          <li className="notice-item notice-viewmore" onClick={() => navigate('/notice?tab=faq')} style={{ cursor: 'pointer', justifyContent: 'center' }}>
            <span style={{ color: '#999', fontSize: '13px' }}>더보기 →</span>
          </li>
        </ul>
      )}

      {activeTab === 'qna' && (
        <ul className="notice-list">
          {questions.length === 0 ? (
            <li className="notice-item" style={{ justifyContent: 'center', color: '#999' }}>
              {localStorage.getItem('user') ? '등록된 문의가 없습니다.' : '로그인이 필요합니다.'}
            </li>
          ) : (
            questions.map((q) => (
              <li
                key={q.QUESTION_NUM}
                className="notice-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/notice?tab=qna')}
              >
                <div className="notice-item-img">
                  <span>💬</span>
                </div>
                <p className="notice-item-title">{q.TITLE}</p>
                <span className="notice-item-date">
                  {new Date(q.CREATED_TIME).toLocaleDateString('ko-KR')}
                </span>
              </li>
            ))
          )}
          <li className="notice-item notice-viewmore" onClick={() => navigate('/notice?tab=qna')} style={{ cursor: 'pointer', justifyContent: 'center' }}>
            <span style={{ color: '#999', fontSize: '13px' }}>더보기 →</span>
          </li>
        </ul>
      )}

    </section>
  );
}
