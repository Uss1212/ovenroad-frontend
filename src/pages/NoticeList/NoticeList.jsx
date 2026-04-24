/* ===================================================
   NoticeList 컴포넌트 (고객지원 페이지)
   - 이 페이지는 3개의 탭(버튼)으로 나뉘어 있음
   - [공지사항] 탭: 관리자가 올린 공지 목록을 보여줌
   - [FAQ] 탭: 자주 묻는 질문과 답변 (클릭하면 답변이 펼쳐짐)
   - [문의하기] 탭: 로그인한 사용자가 1:1로 문의를 작성하고,
                   내가 보낸 문의 목록과 관리자 답변을 확인하는 곳
   - 문의는 "비공개"로 처리됨 → 본인과 관리자만 볼 수 있음
   =================================================== */

/* --- React 도구 가져오기 --- */
/* useState: 데이터(상태)를 저장하고 바꾸는 도구 */
/* useEffect: 페이지가 열리거나 특정 값이 바뀔 때 자동으로 실행되는 도구 */
import { useState, useEffect } from 'react';

/* --- 페이지 이동 + URL 파라미터 도구 --- */
/* useNavigate: 버튼 클릭 시 다른 페이지로 이동시키는 도구 */
/* useSearchParams: URL 뒤에 붙는 ?tab=notice 같은 값을 읽고 쓰는 도구 */
import { useNavigate, useSearchParams } from 'react-router-dom';

/* --- 백엔드 서버와 통신하는 API 함수들 --- */
/* getNoticeList: 공지사항 목록을 서버에서 가져오는 함수 */
/* getFaqList: FAQ(자주 묻는 질문) 목록을 서버에서 가져오는 함수 */
/* getQuestionList: 내가 보낸 문의 목록을 서버에서 가져오는 함수 */
/* getQuestionDetail: 문의 1개의 상세 내용 + 답변을 서버에서 가져오는 함수 */
/* createQuestion: 새 문의를 서버에 보내서 등록하는 함수 */
import {
  getNoticeList,
  getFaqList,
  getQuestionList,
  getQuestionDetail,
  createQuestion,
} from '../../api/apiAxios';

/* --- 이 페이지 전용 CSS 스타일 --- */
import './NoticeList.css';

export default function NoticeList() {

  /* --- 페이지 이동 도구 --- */
  /* navigate('/login') 하면 로그인 페이지로 이동함 */
  const navigate = useNavigate();

  /* --- URL 파라미터 도구 --- */
  /* 예: /notice?tab=faq 이면 searchParams.get('tab')이 'faq'가 됨 */
  /* setSearchParams({ tab: 'faq' }) 하면 URL이 /notice?tab=faq 로 바뀜 */
  const [searchParams, setSearchParams] = useSearchParams();

  /* --- 현재 선택된 탭 --- */
  /* URL에 ?tab=이 없으면 기본값 'notice'(공지사항) 탭을 보여줌 */
  /* 'notice' = 공지사항 탭, 'faq' = FAQ 탭, 'question' = 문의하기 탭 */
  const currentTab = searchParams.get('tab') || 'notice';

  /* ===== 로그인 사용자 정보 ===== */
  /* user: 지금 로그인한 사람의 정보 (없으면 null = 로그인 안 한 상태) */
  const [user, setUser] = useState(null);

  /* 페이지가 처음 열릴 때, localStorage에서 저장된 사용자 정보를 가져옴 */
  /* localStorage: 브라우저에 데이터를 저장해두는 작은 창고 */
  useEffect(() => {
    const saved = localStorage.getItem('user');
    /* 저장된 사용자가 있으면 → JSON 문자열을 객체로 변환해서 user에 저장 */
    if (saved) setUser(JSON.parse(saved));
  }, []); /* [] = 페이지가 처음 열릴 때 한 번만 실행 */

  /* ===== 공지사항 관련 상태 ===== */
  /* notices: 서버에서 가져온 공지사항 목록 (배열) */
  const [notices, setNotices] = useState([]);
  /* noticeLoading: 공지사항을 불러오는 중이면 true (로딩 표시용) */
  const [noticeLoading, setNoticeLoading] = useState(false);

  /* ===== FAQ 관련 상태 ===== */
  /* faqs: 서버에서 가져온 FAQ(자주 묻는 질문) 목록 (배열) */
  const [faqs, setFaqs] = useState([]);
  /* faqLoading: FAQ를 불러오는 중이면 true */
  const [faqLoading, setFaqLoading] = useState(false);
  /* openFaq: 지금 펼쳐져 있는 FAQ의 번호 (null이면 아무것도 안 펼쳐진 상태) */
  /* FAQ를 클릭하면 답변이 아래에 펼쳐지고, 다시 클릭하면 접히는 구조 */
  const [openFaq, setOpenFaq] = useState(null);

  /* ===== 문의하기 관련 상태 ===== */
  /* questions: 내가 보낸 문의 목록 (배열) */
  const [questions, setQuestions] = useState([]);
  /* questionLoading: 문의 목록을 불러오는 중이면 true */
  const [questionLoading, setQuestionLoading] = useState(false);
  /* showForm: 문의 작성 폼(입력 양식)이 보이는 중이면 true */
  const [showForm, setShowForm] = useState(false);
  /* qTitle: 문의 제목 입력값 */
  const [qTitle, setQTitle] = useState('');
  /* qContent: 문의 내용 입력값 */
  const [qContent, setQContent] = useState('');
  /* submitting: 문의를 서버에 보내는 중이면 true (버튼 비활성화용) */
  const [submitting, setSubmitting] = useState(false);
  /* selectedQuestion: 클릭해서 상세를 보고 있는 문의 (null이면 상세를 안 보는 상태) */
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  /* ===== 탭이 바뀔 때마다 해당 탭의 데이터를 서버에서 가져옴 ===== */
  /* 예: 공지사항 탭을 누르면 → fetchNotices() 실행 → 서버에서 공지 목록을 가져옴 */
  /* 예: FAQ 탭을 누르면 → fetchFaqs() 실행 → 서버에서 FAQ 목록을 가져옴 */
  /* 예: 문의하기 탭을 누르면 → fetchQuestions() 실행 → 서버에서 내 문의 목록을 가져옴 */
  useEffect(() => {
    if (currentTab === 'notice') fetchNotices();
    else if (currentTab === 'faq') fetchFaqs();
    else if (currentTab === 'question') fetchQuestions();
  }, [currentTab]); /* currentTab이 바뀔 때마다 실행됨 */

  /* --- 공지사항 목록을 서버에서 가져오는 함수 --- */
  async function fetchNotices() {
    setNoticeLoading(true); /* 로딩 시작 */
    try {
      /* 서버에 공지사항 목록을 요청하고, 받아온 데이터를 notices에 저장 */
      const data = await getNoticeList();
      setNotices(data);
    } catch (err) {
      /* 에러가 나면 콘솔(개발자 도구)에 에러 메시지 출력 */
      console.error('공지사항 불러오기 실패:', err);
    } finally {
      setNoticeLoading(false); /* 로딩 끝 (성공이든 실패든 항상 실행) */
    }
  }

  /* --- FAQ 목록을 서버에서 가져오는 함수 --- */
  async function fetchFaqs() {
    setFaqLoading(true);
    try {
      const data = await getFaqList();
      setFaqs(data);
    } catch (err) {
      console.error('FAQ 불러오기 실패:', err);
    } finally {
      setFaqLoading(false);
    }
  }

  /* --- 내 문의 목록을 서버에서 가져오는 함수 --- */
  /* 로그인 안 했으면(user가 null이면) 그냥 아무것도 안 함 */
  async function fetchQuestions() {
    if (!user) return;
    setQuestionLoading(true);
    try {
      /* user.userNum = 내 회원번호 → 이걸 보내서 "나의 문의"만 가져옴 */
      const data = await getQuestionList(user.userNum);
      setQuestions(data);
    } catch (err) {
      console.error('문의 불러오기 실패:', err);
    } finally {
      setQuestionLoading(false);
    }
  }

  /* --- 탭을 바꾸는 함수 --- */
  /* 탭 버튼을 클릭하면 이 함수가 실행됨 */
  /* 1) URL의 ?tab= 값을 바꿈 → useEffect가 감지해서 데이터를 새로 가져옴 */
  /* 2) 보고 있던 문의 상세나 작성 폼을 닫음 */
  function changeTab(tab) {
    setSearchParams({ tab });       /* URL 파라미터 변경 (예: ?tab=faq) */
    setSelectedQuestion(null);      /* 문의 상세 보기 닫기 */
    setShowForm(false);             /* 문의 작성 폼 닫기 */
  }

  /* --- 문의를 서버에 보내서 등록하는 함수 --- */
  /* 문의 작성 폼에서 "문의 등록" 버튼을 누르면 실행됨 */
  async function handleSubmitQuestion(e) {
    e.preventDefault(); /* 폼 제출 시 페이지가 새로고침되는 걸 막음 */

    /* 제목이 비어있으면 알림창 표시 */
    if (!qTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setSubmitting(true); /* 등록 버튼을 "등록 중..."으로 바꿈 (중복 클릭 방지) */
    try {
      /* 서버에 문의 등록 요청 (회원번호, 제목, 내용) */
      await createQuestion(user.userNum, qTitle.trim(), qContent.trim());
      alert('문의가 등록되었습니다.');

      /* 입력한 내용 초기화 + 폼 닫기 + 문의 목록 새로고침 */
      setQTitle('');
      setQContent('');
      setShowForm(false);
      fetchQuestions(); /* 방금 등록한 문의가 목록에 나타나도록 다시 가져옴 */
    } catch (err) {
      alert(err.message || '문의 등록에 실패했습니다.');
    } finally {
      setSubmitting(false); /* 버튼 다시 활성화 */
    }
  }

  /* --- 문의 1개를 클릭했을 때 상세 내용을 보여주는 함수 --- */
  /* 이미 같은 문의를 보고 있으면 → 닫기 (토글 방식) */
  /* 다른 문의를 클릭하면 → 서버에서 상세 + 답변을 가져와서 보여줌 */
  async function handleViewQuestion(questionNum) {
    /* 이미 열려있는 문의를 다시 클릭하면 닫기 */
    if (selectedQuestion?.QUESTION_NUM === questionNum) {
      setSelectedQuestion(null);
      return;
    }
    try {
      /* 서버에서 해당 문의의 상세 내용 + 관리자 답변을 가져옴 */
      const data = await getQuestionDetail(questionNum);
      setSelectedQuestion(data);
    } catch (err) {
      alert(err.message || '문의 상세를 불러올 수 없습니다.');
    }
  }

  /* --- 탭 버튼에 보여줄 목록 --- */
  /* key: 내부에서 구분하는 이름, label: 화면에 보여줄 한글 이름 */
  const tabs = [
    { key: 'notice', label: '공지사항' },   /* 첫 번째 탭 */
    { key: 'faq', label: 'FAQ' },           /* 두 번째 탭 */
    { key: 'question', label: '문의하기' }, /* 세 번째 탭 */
  ];

  /* ===================================================
     화면에 보여줄 부분 (JSX)
     =================================================== */
  return (
    /* 전체 페이지를 감싸는 큰 상자 */
    <div className="notice-list-page">

      {/* ===== 페이지 맨 위: 제목 + 설명 ===== */}
      <div className="nl-header">
        <h1 className="nl-title">고객지원</h1>
        <p className="nl-subtitle">공지사항, 자주 묻는 질문, 1:1 문의를 확인하세요</p>
      </div>

      {/* ===== 탭 버튼 3개 (공지사항 / FAQ / 문의하기) ===== */}
      {/* tabs 배열을 하나씩 꺼내서 버튼으로 만듦 */}
      {/* 지금 선택된 탭이면 'active' 클래스 추가 → 버튼 색이 까맣게 바뀜 */}
      <div className="nl-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nl-tab ${currentTab === tab.key ? 'active' : ''}`}
            onClick={() => changeTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 탭 내용 (선택된 탭에 따라 다른 내용이 보임) ===== */}

      {/* ──────────────────────────────────────────────── */}
      {/* ── 1) 공지사항 탭 ── */}
      {/* currentTab이 'notice'일 때만 이 부분이 화면에 나타남 */}
      {/* ──────────────────────────────────────────────── */}
      {currentTab === 'notice' && (
        <div className="nl-list">
          {/* 로딩 중이면 "불러오는 중..." 표시 */}
          {noticeLoading ? (
            <div className="nl-empty"><p>불러오는 중...</p></div>
          ) : notices.length === 0 ? (
            /* 공지사항이 하나도 없으면 안내 문구 표시 */
            <div className="nl-empty"><p>등록된 공지사항이 없습니다.</p></div>
          ) : (
            /* 공지사항 배열을 하나씩 꺼내서 카드로 만듦 */
            notices.map((notice) => (
              <div
                key={notice.NOTICE_NUM} /* 각 항목을 구분하는 고유 키 */
                className="nl-item"
                onClick={() => navigate(`/notice/${notice.NOTICE_NUM}`)}
                /* ↑ 클릭하면 공지사항 상세 페이지로 이동 (예: /notice/5) */
              >
                {/* 왼쪽: "공지" 뱃지 */}
                <div className="nl-item-left">
                  <span className="nl-category" style={{ color: '#3b82f6', backgroundColor: '#3b82f615' }}>
                    공지
                  </span>
                </div>
                {/* 가운데: 제목 + 작성자 */}
                <div className="nl-item-body">
                  <h3 className="nl-item-title">{notice.TITLE}</h3>
                  <p className="nl-item-preview">{notice.author}</p>
                </div>
                {/* 오른쪽: 작성 날짜 */}
                <div className="nl-item-right">
                  <span className="nl-item-date">
                    {/* 날짜를 한국 형식(예: 2026. 4. 24.)으로 변환 */}
                    {new Date(notice.CREATED_TIME).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* ── 2) FAQ 탭 (자주 묻는 질문) ── */}
      {/* 아코디언 방식: 질문을 클릭하면 답변이 아래로 펼쳐지고, */}
      {/*               다시 클릭하면 접히는 구조 */}
      {/* ──────────────────────────────────────────────── */}
      {currentTab === 'faq' && (
        <div className="nl-faq-list">
          {faqLoading ? (
            <div className="nl-empty"><p>불러오는 중...</p></div>
          ) : faqs.length === 0 ? (
            <div className="nl-empty"><p>등록된 FAQ가 없습니다.</p></div>
          ) : (
            /* FAQ 배열을 하나씩 꺼내서 질문+답변 카드로 만듦 */
            faqs.map((faq) => (
              <div
                key={faq.FAQ_NUM}
                /* 펼쳐진 FAQ이면 'open' 클래스 추가 (테두리 색 변경) */
                className={`nl-faq-item ${openFaq === faq.FAQ_NUM ? 'open' : ''}`}
              >
                {/* 질문 부분 (클릭하면 펼침/접힘 토글) */}
                <button
                  className="nl-faq-question"
                  onClick={() => setOpenFaq(openFaq === faq.FAQ_NUM ? null : faq.FAQ_NUM)}
                  /* ↑ 이미 열려있는 FAQ를 클릭하면 null로 → 접힘 */
                  /* ↑ 다른 FAQ를 클릭하면 그 FAQ 번호로 → 펼쳐짐 */
                >
                  {/* 파란색 Q 동그라미 */}
                  <span className="nl-faq-q-label">Q</span>
                  {/* 질문 내용 */}
                  <span className="nl-faq-q-text">{faq.QUESTION}</span>
                  {/* 화살표 (펼쳐졌으면 ▲, 접혀있으면 ▼) */}
                  <span className="nl-faq-arrow">{openFaq === faq.FAQ_NUM ? '▲' : '▼'}</span>
                </button>

                {/* 답변 부분 (펼쳐진 FAQ만 보임) */}
                {openFaq === faq.FAQ_NUM && (
                  <div className="nl-faq-answer">
                    {/* 주황색 A 동그라미 */}
                    <span className="nl-faq-a-label">A</span>
                    {/* 답변 내용 */}
                    <span className="nl-faq-a-text">{faq.ANSWER}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* ── 3) 문의하기 탭 ── */}
      {/* 로그인 안 했으면 → "로그인 후 문의하실 수 있습니다" + 로그인 버튼 */}
      {/* 로그인 했으면 → 문의 작성 버튼 + 내 문의 목록 */}
      {/* 모든 문의는 "비공개"로 본인과 관리자만 볼 수 있음 */}
      {/* ──────────────────────────────────────────────── */}
      {currentTab === 'question' && (
        <div className="nl-question-section">

          {/* --- 로그인 안 한 상태 --- */}
          {!user ? (
            <div className="nl-empty">
              <p>로그인 후 문의하실 수 있습니다.</p>
              <button className="nl-login-btn" onClick={() => navigate('/login')}>
                로그인하기
              </button>
            </div>
          ) : (
            /* --- 로그인 한 상태 --- */
            <>
              {/* ===== 문의 작성 버튼 ===== */}
              {/* 작성 폼도 안 보이고, 상세도 안 보일 때만 이 버튼이 보임 */}
              {!showForm && !selectedQuestion && (
                <button
                  className="nl-write-btn"
                  onClick={() => setShowForm(true)} /* 클릭하면 작성 폼이 나타남 */
                >
                  문의 작성하기
                </button>
              )}

              {/* ===== 문의 작성 폼 (입력 양식) ===== */}
              {/* showForm이 true일 때만 보임 */}
              {showForm && (
                <form className="nl-question-form" onSubmit={handleSubmitQuestion}>
                  <h3 className="nl-form-title">1:1 문의 작성</h3>
                  {/* 안내 문구: 비공개라는 것을 알려줌 */}
                  <p className="nl-form-desc">문의 내용은 본인과 관리자만 확인할 수 있습니다.</p>

                  {/* 제목 입력란 */}
                  <input
                    type="text"
                    className="nl-form-input"
                    placeholder="제목을 입력하세요"
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    /* ↑ 글자를 입력할 때마다 qTitle 상태가 업데이트됨 */
                    maxLength={100} /* 최대 100글자까지만 입력 가능 */
                  />

                  {/* 내용 입력란 (여러 줄 입력 가능) */}
                  <textarea
                    className="nl-form-textarea"
                    placeholder="문의 내용을 입력하세요"
                    value={qContent}
                    onChange={(e) => setQContent(e.target.value)}
                    rows={6} /* 기본 6줄 높이 */
                  />

                  {/* 취소 / 등록 버튼 */}
                  <div className="nl-form-actions">
                    {/* 취소 버튼: 입력 내용 지우고 폼 닫기 */}
                    <button
                      type="button"
                      className="nl-form-cancel"
                      onClick={() => { setShowForm(false); setQTitle(''); setQContent(''); }}
                    >
                      취소
                    </button>
                    {/* 등록 버튼: 서버에 문의를 보냄 */}
                    {/* submitting이 true면 버튼이 비활성화되어 중복 클릭 방지 */}
                    <button
                      type="submit"
                      className="nl-form-submit"
                      disabled={submitting}
                    >
                      {submitting ? '등록 중...' : '문의 등록'}
                    </button>
                  </div>
                </form>
              )}

              {/* ===== 문의 상세 보기 ===== */}
              {/* 문의 목록에서 문의 1개를 클릭하면 이 부분이 나타남 */}
              {/* 제목, 작성일, 답변상태, 내용, 관리자 답변을 보여줌 */}
              {selectedQuestion && (
                <div className="nl-question-detail">
                  {/* "← 목록으로" 버튼: 클릭하면 상세를 닫고 목록으로 돌아감 */}
                  <button
                    className="nl-detail-back"
                    onClick={() => setSelectedQuestion(null)}
                  >
                    ← 목록으로
                  </button>

                  {/* 문의 제목 + 날짜 + 상태 */}
                  <div className="nl-detail-header">
                    <h3 className="nl-detail-title">{selectedQuestion.TITLE}</h3>
                    <div className="nl-detail-meta">
                      {/* 작성 날짜 */}
                      <span>{new Date(selectedQuestion.CREATED_TIME).toLocaleDateString('ko-KR')}</span>
                      {/* 답변 상태: STATUS가 1이면 "답변완료"(초록), 0이면 "답변대기"(주황) */}
                      <span className={`nl-status ${selectedQuestion.STATUS === 1 ? 'answered' : ''}`}>
                        {selectedQuestion.STATUS === 1 ? '답변완료' : '답변대기'}
                      </span>
                    </div>
                  </div>

                  {/* 내가 작성한 문의 내용 */}
                  <div className="nl-detail-content">
                    {selectedQuestion.CONTENT || '(내용 없음)'}
                  </div>

                  {/* ===== 관리자 답변 목록 ===== */}
                  {/* 답변이 1개 이상 있을 때만 보임 */}
                  {selectedQuestion.answers && selectedQuestion.answers.length > 0 && (
                    <div className="nl-answers">
                      <h4 className="nl-answers-title">관리자 답변</h4>
                      {/* 답변을 하나씩 꺼내서 카드로 만듦 */}
                      {selectedQuestion.answers.map((ans) => (
                        <div key={ans.ANSWER_NUM} className="nl-answer-item">
                          {/* 답변 작성자 + 날짜 */}
                          <div className="nl-answer-meta">
                            <span className="nl-answer-author">{ans.author}</span>
                            <span className="nl-answer-date">
                              {new Date(ans.CREATED_TIME).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          {/* 답변 내용 */}
                          <div className="nl-answer-content">{ans.CONTENT}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== 내 문의 목록 ===== */}
              {/* 작성 폼도 안 보이고, 상세도 안 보일 때만 목록이 보임 */}
              {!showForm && !selectedQuestion && (
                <div className="nl-question-list">
                  <h3 className="nl-question-list-title">내 문의 내역</h3>
                  {questionLoading ? (
                    <div className="nl-empty"><p>불러오는 중...</p></div>
                  ) : questions.length === 0 ? (
                    <div className="nl-empty"><p>등록된 문의가 없습니다.</p></div>
                  ) : (
                    /* 내 문의를 하나씩 꺼내서 카드로 만듦 */
                    questions.map((q) => (
                      <div
                        key={q.QUESTION_NUM}
                        className="nl-item"
                        onClick={() => handleViewQuestion(q.QUESTION_NUM)}
                        /* ↑ 클릭하면 상세 보기 함수 실행 */
                      >
                        {/* 왼쪽: "비공개" 뱃지 (본인과 관리자만 볼 수 있다는 표시) */}
                        <div className="nl-item-left">
                          <span className="nl-category nl-private-badge">
                            비공개
                          </span>
                        </div>
                        {/* 가운데: 문의 제목 + 작성자 닉네임 */}
                        <div className="nl-item-body">
                          <h3 className="nl-item-title">{q.TITLE}</h3>
                          <p className="nl-item-preview">{q.author}</p>
                        </div>
                        {/* 오른쪽: 답변 상태 + 작성 날짜 */}
                        <div className="nl-item-right">
                          {/* STATUS가 1이면 "답변완료"(초록), 0이면 "답변대기"(주황) */}
                          <span className={`nl-status ${q.STATUS === 1 ? 'answered' : ''}`}>
                            {q.STATUS === 1 ? '답변완료' : '답변대기'}
                          </span>
                          <span className="nl-item-date">
                            {new Date(q.CREATED_TIME).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
