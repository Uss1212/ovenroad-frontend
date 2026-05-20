import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './BreadBTI.css';

function BreadBTI() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ crispy: 0, sweet: 0, healthy: 0, cream: 0 });
  const [history, setHistory] = useState([]); // [{step, scores}]
  const [result, setResult] = useState(null);
  const [recommendedBakeries, setRecommendedBakeries] = useState([]);

  const typeMenuMap = {
    crispy:  { keywords: ['크루아상', '크로와상', '소금빵', '페이스트리'], primary: '크루아상' },
    sweet:   { keywords: ['케이크', '도넛', '머핀', '타르트', '마카롱'],   primary: '케이크' },
    healthy: { keywords: ['식빵', '바게트', '치아바타', '사워도우', '통밀'], primary: '식빵' },
    cream:   { keywords: ['크림빵', '슈크림', '에클레어', '생크림'],        primary: '크림빵' },
  };

  const questions = [
    {
      question: 'Q. 비 오는 주말 아침 당신의 선택은?',
      options: [
        { emoji: '🥐', name: '크루아상',   desc: '바스락! 소리까지 맛있는',   type: 'crispy' },
        { emoji: '🍩', name: '초코도넛',   desc: '입안 가득 퍼지는 달콤함',   type: 'sweet'  },
      ],
    },
    {
      question: 'Q. 커피와 함께 먹을 빵을 고른다면?',
      options: [
        { emoji: '🥖', name: '바게트',     desc: '고소하고 담백한 맛',        type: 'healthy' },
        { emoji: '🧁', name: '슈크림빵',   desc: '크림이 가득한 부드러움',    type: 'cream'  },
      ],
    },
    {
      question: 'Q. 친구 생일에 빵을 선물한다면?',
      options: [
        { emoji: '🎂', name: '생크림케이크', desc: '화려하고 달콤한 특별함',  type: 'cream'   },
        { emoji: '🥐', name: '크루아상 세트', desc: '고급스러운 버터 페이스트리', type: 'crispy' },
      ],
    },
    {
      question: 'Q. 다이어트 중 빵이 먹고 싶다면?',
      options: [
        { emoji: '🍞', name: '통밀빵',     desc: '건강하고 담백한 선택',      type: 'healthy' },
        { emoji: '🍰', name: '케이크 한 조각', desc: '어차피 먹을 거 달콤하게', type: 'sweet'  },
      ],
    },
  ];

  const results = {
    crispy:  { emoji: '🥐', name: '바삭장인',   desc: '버터 풍미와 바삭한 식감을 사랑하는 당신!\n크루아상, 페이스트리, 소금빵이 인생빵이에요.', color: '#b45309' },
    sweet:   { emoji: '🍩', name: '달달마스터', desc: '달콤한 빵 앞에서는 참을 수 없는 당신!\n케이크, 도넛, 마카롱이라면 언제든 환영이에요.', color: '#db2777' },
    healthy: { emoji: '🍞', name: '건강빵러버', desc: '담백하고 건강한 빵을 추구하는 당신!\n통밀빵, 바게트, 치아바타가 최고예요.',              color: '#059669' },
    cream:   { emoji: '🧁', name: '크림폭탄',   desc: '부드러운 크림이 없으면 빵이 아닌 당신!\n슈크림빵, 크림빵, 에클레어를 사랑해요.',        color: '#7c3aed' },
  };

  const totalQuestions = questions.length;
  const currentQ = questions[Math.min(step, totalQuestions - 1)];

  useEffect(() => {
    if (!result) return;
    const menu = typeMenuMap[result].primary;
    fetch(`${BASE_URL}/api/places?menu=${encodeURIComponent(menu)}`)
      .then(r => r.json())
      .then(data => {
        const top3 = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 3)
          .map(p => ({
            id: p.PLACE_NUM, name: p.PLACE_NAME,
            address: p.ADDRESS || '',
            rating: p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0',
            image: p.thumbnailImage || null,
          }));
        setRecommendedBakeries(top3);
      })
      .catch(err => console.error('추천 빵집 불러오기 실패:', err));
  }, [result]);

  function handleSelect(type) {
    setHistory(h => [...h, { step, scores: { ...scores } }]);
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    if (step + 1 >= totalQuestions) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    }
    setStep(step + 1);
  }

  function handleBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setStep(prev.step);
    setScores(prev.scores);
    setHistory(h => h.slice(0, -1));
    setResult(null);
  }

  function handleRetry() {
    setStep(0);
    setScores({ crispy: 0, sweet: 0, healthy: 0, cream: 0 });
    setHistory([]);
    setResult(null);
    setRecommendedBakeries([]);
  }

  return (
    <section className="bti-section">
      <div className="bti-box">

        {/* 헤더 */}
        <div className="bti-header">
          <span className="bti-badge">MINI GAME</span>
          <h2 className="bti-title">나의 빵BTI는 무엇일까?</h2>
          <p className="bti-subtitle">당신의 취향을 저격할 빵은?</p>
        </div>

        {!result ? (
          <div className="bti-game">
            {/* 프로그레스 바 */}
            <div className="bti-progress">
              <div className="bti-progress-bar">
                <div className="bti-progress-fill" style={{ width: `${(step / totalQuestions) * 100}%` }} />
              </div>
            </div>

            {/* 질문 */}
            <h3 className="bti-question" key={step}>{currentQ.question}</h3>

            {/* 선택지 2개 */}
            <div className="bti-options">
              {currentQ.options.map((opt, i) => (
                <button key={i} className="bti-option" onClick={() => handleSelect(opt.type)}>
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

            {/* 페이지네이션 */}
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
        ) : (
          /* 결과 화면 */
          <div className="bti-result">
            <div className="bti-result-emoji">{results[result].emoji}</div>
            <h3 className="bti-result-title">
              당신은 확신의{' '}
              <span style={{ color: results[result].color }}>{results[result].name}</span>!
            </h3>
            <p className="bti-result-desc">{results[result].desc}</p>

            <div className="bti-score-bars">
              {Object.entries(results).map(([key, val]) => (
                <div key={key} className="bti-score-row">
                  <span className="bti-score-label">{val.emoji} {val.name}</span>
                  <div className="bti-score-track">
                    <div className="bti-score-fill" style={{ width: `${(scores[key] / totalQuestions) * 100}%`, background: val.color }} />
                  </div>
                  <span className="bti-score-num">{scores[key]}</span>
                </div>
              ))}
            </div>

            {recommendedBakeries.length > 0 && (
              <div className="bti-recommend">
                <p className="bti-recommend-title">{results[result].emoji} {results[result].name}을 위한 추천 빵집</p>
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
              <button className="bti-btn-retry" onClick={handleRetry}>다시하기</button>
              <button className="bti-btn-explore" onClick={() => navigate(`/places?menu=${encodeURIComponent(typeMenuMap[result].primary)}`)}>
                {results[result].name} 빵집 더보기 →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default BreadBTI;
