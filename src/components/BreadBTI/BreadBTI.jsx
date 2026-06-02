import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './BreadBTI.css';

function BreadBTI() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState('idle'); // idle | loading-q | playing | loading-r | result
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [recommendedBakeries, setRecommendedBakeries] = useState([]);

  async function startBTI() {
    setPhase('loading-q');
    setAnswers([]);
    setHistory([]);
    setStep(0);
    setResult(null);
    setRecommendedBakeries([]);
    try {
      const res = await fetch(`${BASE_URL}/api/bti/questions`);
      const data = await res.json();
      setQuestions(data);
      setPhase('playing');
    } catch {
      setPhase('idle');
      alert('질문 불러오기에 실패했어요. 다시 시도해주세요.');
    }
  }

  async function submitAnswers(finalAnswers) {
    setPhase('loading-r');
    try {
      const res = await fetch(`${BASE_URL}/api/bti/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      setResult(data);
      setPhase('result');
    } catch {
      setPhase('idle');
      alert('결과 분석에 실패했어요. 다시 시도해주세요.');
    }
  }

  useEffect(() => {
    if (!result || !result.keywords?.length) return;
    const keyword = result.keywords[0];
    fetch(`${BASE_URL}/api/places?menu=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(data => {
        const top3 = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 3)
          .map(p => ({
            id: p.PLACE_NUM,
            name: p.PLACE_NAME,
            rating: p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0',
            image: p.thumbnailImage || null,
          }));
        setRecommendedBakeries(top3);
      })
      .catch(() => {});
  }, [result]);

  function handleSelect(option) {
    const currentQ = questions[step];
    const newAnswer = { question: currentQ.question, chosen: { name: option.name, desc: option.desc } };
    const newAnswers = [...answers, newAnswer];
    setHistory(h => [...h, { step, answers }]);
    setAnswers(newAnswers);

    if (step + 1 >= questions.length) {
      submitAnswers(newAnswers);
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setStep(prev.step);
    setAnswers(prev.answers);
    setHistory(h => h.slice(0, -1));
  }

  const totalQuestions = questions.length;
  const currentQ = questions[step];

  return (
    <section className="bti-section">
      <div className="bti-box">

        <div className="bti-header">
          <span className="bti-badge">AI MINI GAME</span>
          <h2 className="bti-title">나의 빵BTI는 무엇일까?</h2>
          <p className="bti-subtitle">AI가 분석하는 나만의 빵 유형</p>
        </div>

        {/* 시작 전 */}
        {phase === 'idle' && (
          <div className="bti-start">
            <p className="bti-start-desc">매번 AI가 새로운 질문을 만들어요.<br />당신만의 빵 유형을 찾아보세요!</p>
            <button className="bti-btn-start" onClick={startBTI}>시작하기 🍞</button>
          </div>
        )}

        {/* 질문 로딩 */}
        {phase === 'loading-q' && (
          <div className="bti-loading">
            <div className="bti-spinner" />
            <p>AI가 질문을 만들고 있어요...</p>
          </div>
        )}

        {/* 게임 진행 */}
        {phase === 'playing' && currentQ && (
          <div className="bti-game">
            <div className="bti-progress">
              <div className="bti-progress-bar">
                <div className="bti-progress-fill" style={{ width: `${(step / totalQuestions) * 100}%` }} />
              </div>
            </div>

            <h3 className="bti-question" key={step}>{currentQ.question}</h3>

            <div className="bti-options">
              {currentQ.options.map((opt, i) => (
                <button key={i} className="bti-option" onClick={() => handleSelect(opt)}>
                  <div className="bti-option-img-area">
                    <span className="bti-emoji">{opt.emoji}</span>
                  </div>
                  <div className="bti-option-text-area">
                    <p className="bti-option-desc">{opt.desc}</p>
                    <p className="bti-option-name">{opt.name}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bti-pagination">
              <button
                className="bti-pagination-arrow"
                onClick={handleBack}
                disabled={history.length === 0}
                aria-label="이전 질문"
              ><i className="fi fi-rr-caret-left"></i></button>
              <span className="bti-pagination-text">
                <strong>{step + 1}</strong>
                <span className="bti-pagination-sep"> / </span>
                {totalQuestions}
              </span>
              <button
                className="bti-pagination-arrow bti-pagination-arrow-right"
                disabled
                aria-label="다음 질문"
              ><i className="fi fi-rr-caret-right"></i></button>
            </div>
          </div>
        )}

        {/* 결과 분석 로딩 */}
        {phase === 'loading-r' && (
          <div className="bti-loading">
            <div className="bti-spinner" />
            <p>AI가 당신의 빵 유형을 분석하고 있어요...</p>
          </div>
        )}

        {/* 결과 */}
        {phase === 'result' && result && (
          <div className="bti-result">
            <div className="bti-result-emoji">{result.emoji}</div>
            <h3 className="bti-result-title">
              당신은 확신의{' '}
              <span style={{ color: result.color }}>{result.typeName}</span>!
            </h3>
            <p className="bti-result-desc">{result.description}</p>

            {result.keywords?.length > 0 && (
              <div className="bti-result-keywords">
                {result.keywords.map((k, i) => (
                  <span key={i} className="bti-keyword-tag" style={{ borderColor: result.color, color: result.color }}>#{k}</span>
                ))}
              </div>
            )}

            {recommendedBakeries.length > 0 && (
              <div className="bti-recommend">
                <p className="bti-recommend-title">{result.emoji} {result.typeName}을 위한 추천 빵집</p>
                <div className="bti-recommend-list">
                  {recommendedBakeries.map(b => (
                    <div key={b.id} className="bti-recommend-card" onClick={() => navigate(`/place/${b.id}`)}>
                      <div className="bti-recommend-img">
                        {b.image
                          ? <img src={b.image.startsWith('http') ? b.image : `${BASE_URL}${b.image}`} alt={b.name} />
                          : <span>🍞</span>}
                      </div>
                      <div className="bti-recommend-info">
                        <span className="bti-recommend-name">{b.name}</span>
                        <span className="bti-recommend-rating">⭐ {b.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bti-result-actions">
              <button className="bti-btn-retry" onClick={startBTI}>다시하기</button>
              {result.keywords?.[0] && (
                <button className="bti-btn-explore" onClick={() => navigate(`/places?menu=${encodeURIComponent(result.keywords[0])}`)}>
                  {result.typeName} 빵집 더보기 →
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default BreadBTI;
