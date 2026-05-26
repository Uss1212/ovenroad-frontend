import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNoticeList, getNoticeDetail, getFaqList, getQuestionList, getQuestionDetail,
  getCourseList, getAiCourseList, deleteCourse,
  BASE_URL
} from '../../api/apiAxios';
import './Admin.css';

function request(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(BASE_URL + url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  }).then(async res => {
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || '요청 실패');
    return data;
  });
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('notice');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { navigate('/login'); return; }
    const u = JSON.parse(saved);
    if (u.grade !== 'admin' && u.grade !== 1 && u.grade !== '1') {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
    }
  }, [navigate]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const tabs = [
    { key: 'notice', label: '공지사항' },
    { key: 'faq', label: 'FAQ' },
    { key: 'qna', label: 'QNA' },
    { key: 'course', label: '코스 관리' },
    { key: 'member', label: '회원 관리' },
  ];

  return (
    <div className="admin">
      <div className="admin-container">
        <h1 className="admin-title">관리자 페이지</h1>

        <div className="admin-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); setMsg(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`admin-msg ${msg.type === 'success' ? 'admin-msg-success' : 'admin-msg-error'}`}>
            {msg.text}
          </div>
        )}

        <div className="admin-content">
          {tab === 'notice' && <NoticeTab showMsg={showMsg} />}
          {tab === 'faq' && <FaqTab showMsg={showMsg} />}
          {tab === 'qna' && <QnaTab showMsg={showMsg} />}
          {tab === 'course' && <CourseTab showMsg={showMsg} />}
          {tab === 'member' && <MemberTab showMsg={showMsg} />}
        </div>
      </div>
    </div>
  );
}

/* ===== 공지사항 관리 ===== */
function NoticeTab({ showMsg }) {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = async () => {
    try { setList(await getNoticeList()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (modal === 'new') {
        await request('/api/notice', { method: 'POST', body: JSON.stringify(form) });
        showMsg('공지사항이 등록되었습니다.');
      } else {
        await request(`/api/notice/${modal}`, { method: 'PUT', body: JSON.stringify(form) });
        showMsg('공지사항이 수정되었습니다.');
      }
      setModal(null);
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleEdit = async (noticeNum) => {
    try {
      const data = await getNoticeDetail(noticeNum);
      setForm({ title: data.TITLE, content: data.CONTENT || '' });
      setModal(noticeNum);
    } catch {}
  };

  const handleDelete = async (noticeNum) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await request(`/api/notice/${noticeNum}`, { method: 'DELETE' });
      showMsg('삭제되었습니다.');
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  return (
    <>
      <div className="admin-section-header">
        <span className="admin-section-title">공지사항 목록</span>
        <button className="admin-btn admin-btn-primary" onClick={() => { setForm({ title: '', content: '' }); setModal('new'); }}>
          등록
        </button>
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">등록된 공지사항이 없습니다.</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>작성일</th><th>관리</th></tr></thead>
          <tbody>
            {list.map(n => (
              <tr key={n.NOTICE_NUM}>
                <td>{n.NOTICE_NUM}</td>
                <td>{n.TITLE}</td>
                <td>{n.author}</td>
                <td>{new Date(n.CREATED_TIME).toLocaleDateString()}</td>
                <td className="admin-table-actions">
                  <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleEdit(n.NOTICE_NUM)}>수정</button>
                  <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(n.NOTICE_NUM)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal !== null && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">{modal === 'new' ? '공지사항 등록' : '공지사항 수정'}</h3>
            <div className="admin-form-group">
              <label>제목</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>내용</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setModal(null)}>취소</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== FAQ 관리 ===== */
function FaqTab({ showMsg }) {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', displayOrder: 0 });

  const load = async () => {
    try { setList(await getFaqList()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (modal === 'new') {
        await request('/api/notice/faq', { method: 'POST', body: JSON.stringify(form) });
        showMsg('FAQ가 등록되었습니다.');
      } else {
        await request(`/api/notice/faq/${modal}`, { method: 'PUT', body: JSON.stringify(form) });
        showMsg('FAQ가 수정되었습니다.');
      }
      setModal(null);
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleEdit = (faq) => {
    setForm({ question: faq.FAQ_QUESTION || faq.QUESTION, answer: faq.FAQ_ANSWER || faq.ANSWER, displayOrder: faq.DISPLAY_ORDER || 0 });
    setModal(faq.FAQ_NUM);
  };

  const handleDelete = async (faqNum) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await request(`/api/notice/faq/${faqNum}`, { method: 'DELETE' });
      showMsg('삭제되었습니다.');
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  return (
    <>
      <div className="admin-section-header">
        <span className="admin-section-title">FAQ 목록</span>
        <button className="admin-btn admin-btn-primary" onClick={() => { setForm({ question: '', answer: '', displayOrder: 0 }); setModal('new'); }}>
          등록
        </button>
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">등록된 FAQ가 없습니다.</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>순서</th><th>질문</th><th>답변</th><th>관리</th></tr></thead>
          <tbody>
            {list.map(f => (
              <tr key={f.FAQ_NUM}>
                <td>{f.DISPLAY_ORDER}</td>
                <td>{f.FAQ_QUESTION || f.QUESTION}</td>
                <td>{(f.FAQ_ANSWER || f.ANSWER)?.length > 50 ? (f.FAQ_ANSWER || f.ANSWER).slice(0, 50) + '...' : (f.FAQ_ANSWER || f.ANSWER)}</td>
                <td className="admin-table-actions">
                  <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleEdit(f)}>수정</button>
                  <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(f.FAQ_NUM)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal !== null && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">{modal === 'new' ? 'FAQ 등록' : 'FAQ 수정'}</h3>
            <div className="admin-form-group">
              <label>질문</label>
              <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>답변</label>
              <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>표시 순서</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setModal(null)}>취소</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== QNA 관리 ===== */
function QnaTab({ showMsg }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswer, setEditingAnswer] = useState(null);

  const load = async () => {
    try { setList(await getQuestionList()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleSelect = async (questionNum) => {
    try {
      const data = await getQuestionDetail(questionNum);
      setSelected(data);
      setAnswerText('');
      setEditingAnswer(null);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleAddAnswer = async () => {
    if (!answerText.trim()) return;
    try {
      await request(`/api/notice/question/${selected.QUESTION_NUM}/answer`, {
        method: 'POST', body: JSON.stringify({ content: answerText })
      });
      showMsg('답변이 등록되었습니다.');
      setAnswerText('');
      handleSelect(selected.QUESTION_NUM);
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleEditAnswer = async (answerNum) => {
    if (!editingAnswer?.content?.trim()) return;
    try {
      await request(`/api/notice/question/${selected.QUESTION_NUM}/answer/${answerNum}`, {
        method: 'PUT', body: JSON.stringify({ content: editingAnswer.content })
      });
      showMsg('답변이 수정되었습니다.');
      setEditingAnswer(null);
      handleSelect(selected.QUESTION_NUM);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleDeleteAnswer = async (answerNum) => {
    if (!window.confirm('답변을 삭제하시겠습니까?')) return;
    try {
      await request(`/api/notice/question/${selected.QUESTION_NUM}/answer/${answerNum}`, { method: 'DELETE' });
      showMsg('답변이 삭제되었습니다.');
      handleSelect(selected.QUESTION_NUM);
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  return (
    <>
      <div className="admin-section-header">
        <span className="admin-section-title">문의 목록</span>
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">등록된 문의가 없습니다.</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>상태</th><th>작성일</th></tr></thead>
          <tbody>
            {list.map(q => (
              <tr key={q.QUESTION_NUM} onClick={() => handleSelect(q.QUESTION_NUM)} style={{ cursor: 'pointer' }}>
                <td>{q.QUESTION_NUM}</td>
                <td>{q.TITLE}</td>
                <td>{q.author}</td>
                <td>
                  <span className={`admin-badge ${q.answerCount > 0 ? 'admin-badge-done' : 'admin-badge-waiting'}`}>
                    {q.answerCount > 0 ? '답변완료' : '답변대기'}
                  </span>
                </td>
                <td>{new Date(q.CREATED_TIME).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">문의 상세</h3>
            <div style={{ marginBottom: '1rem' }}>
              <strong>{selected.TITLE}</strong>
              <p style={{ color: '#57534e', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selected.CONTENT}</p>
              <small style={{ color: '#a8a29e' }}>{selected.author} | {new Date(selected.CREATED_TIME).toLocaleDateString()}</small>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f5f5f4', margin: '1rem 0' }} />

            <h4 style={{ marginBottom: '0.75rem' }}>답변 ({selected.answers?.length || 0})</h4>
            {selected.answers?.map(a => (
              <div key={a.ANSWER_NUM} className="admin-answer-box" style={{ marginBottom: '0.5rem' }}>
                {editingAnswer?.num === a.ANSWER_NUM ? (
                  <>
                    <textarea
                      className="admin-answer-input"
                      value={editingAnswer.content}
                      onChange={e => setEditingAnswer({ ...editingAnswer, content: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleEditAnswer(a.ANSWER_NUM)}>저장</button>
                      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setEditingAnswer(null)}>취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>{a.CONTENT}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: '#a8a29e' }}>{a.author} | {new Date(a.CREATED_TIME).toLocaleDateString()}</small>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setEditingAnswer({ num: a.ANSWER_NUM, content: a.CONTENT })}>수정</button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDeleteAnswer(a.ANSWER_NUM)}>삭제</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div style={{ marginTop: '1rem' }}>
              <textarea
                className="admin-answer-input"
                placeholder="답변을 입력하세요..."
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
              />
              <div className="admin-modal-actions">
                <button className="admin-btn admin-btn-outline" onClick={() => setSelected(null)}>닫기</button>
                <button className="admin-btn admin-btn-primary" onClick={handleAddAnswer}>답변 등록</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== 코스 관리 ===== */
function CourseTab({ showMsg }) {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const [normal, ai] = await Promise.all([getCourseList(), getAiCourseList(true)]);
      const aiNums = new Set(ai.map(c => c.COURSE_NUM));
      const merged = [...ai, ...normal.filter(c => !aiNums.has(c.COURSE_NUM))];
      setList(merged);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (courseNum) => {
    if (!window.confirm('이 코스를 삭제하시겠습니까?')) return;
    try {
      await deleteCourse(courseNum);
      showMsg('코스가 삭제되었습니다.');
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  return (
    <>
      <div className="admin-section-header">
        <span className="admin-section-title">코스 목록</span>
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">등록된 코스가 없습니다.</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>좋아요</th><th>작성일</th><th>관리</th></tr></thead>
          <tbody>
            {list.map(c => (
              <tr key={c.COURSE_NUM}>
                <td>{c.COURSE_NUM}</td>
                <td>{c.TITLE}{c.IS_AI === 1 && <span style={{marginLeft:6,fontSize:'0.75rem',color:'#f59e0b'}}>✦ AI</span>}</td>
                <td>{c.IS_AI === 1 ? 'AI 추천봇' : c.author}</td>
                <td>{c.likeCount}</td>
                <td>{new Date(c.CREATED_TIME).toLocaleDateString()}</td>
                <td>
                  <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(c.COURSE_NUM)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ===== 회원 관리 ===== */
function MemberTab({ showMsg }) {
  const [list, setList] = useState([]);
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  const load = async () => {
    try {
      const data = await request('/api/user/admin/list');
      setList(data);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (userNum) => {
    if (!window.confirm('이 회원을 탈퇴 처리하시겠습니까?')) return;
    try {
      await request(`/api/user/${userNum}`, { method: 'DELETE' });
      showMsg('회원이 탈퇴 처리되었습니다.');
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleGrade = async (userNum, newGrade) => {
    const label = newGrade === 1 ? '관리자로 등록' : '관리자 해제';
    if (!window.confirm(`이 회원을 ${label}하시겠습니까?`)) return;
    try {
      await request(`/api/user/${userNum}/grade`, { method: 'PATCH', body: JSON.stringify({ grade: newGrade }) });
      showMsg(`${label}되었습니다.`);
      load();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const isAdmin = (u) => u.GRADE === 1 || u.GRADE === 'admin';
  const isSelf = (u) => u.USER_NUM === me.userNum;

  return (
    <>
      <div className="admin-section-header">
        <span className="admin-section-title">회원 목록</span>
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">회원이 없습니다.</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>번호</th><th>아이디</th><th>닉네임</th><th>이메일</th><th>등급</th><th>관리</th></tr></thead>
          <tbody>
            {list.map(u => (
              <tr key={u.USER_NUM}>
                <td>{u.USER_NUM}</td>
                <td>{u.ID || '-'}</td>
                <td>{u.NICKNAME}</td>
                <td>{u.EMAIL}</td>
                <td>{isAdmin(u) ? '관리자' : '일반'}</td>
                <td className="admin-table-actions">
                  {!isSelf(u) && (
                    isAdmin(u) ? (
                      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleGrade(u.USER_NUM, 0)}>관리자 해제</button>
                    ) : (
                      <>
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleGrade(u.USER_NUM, 1)}>관리자 등록</button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(u.USER_NUM)}>탈퇴</button>
                      </>
                    )
                  )}
                  {isSelf(u) && <span style={{ color: '#a8a29e', fontSize: '0.8rem' }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
