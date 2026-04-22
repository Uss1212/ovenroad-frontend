/* ===================================================
   빵BTI 미니게임 컴포넌트
   - 4개 질문에 답하면 나의 빵 유형을 알려주는 미니게임
   - 질문마다 2개 선택지, 선택에 따라 점수 누적
   - 프로그레스 바로 진행 상황 표시
   - 4가지 결과 유형: 바삭장인 / 달달마스터 / 건강빵러버 / 크림폭탄
   - 결과 유형에 맞는 빵집 추천 (DB 메뉴 태그 기반)
   =================================================== */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/apiAxios';
import './BreadBTI.css';

function BreadBTI() {
  const navigate = useNavigate();

  /* --- 상태 관리 --- */
  /* 현재 몇 번째 질문인지 (0~3, 4가 되면 결과 화면) */
  const [step, setStep] = useState(0);
  /* 각 유형별 점수 누적 */
  const [scores, setScores] = useState({ crispy: 0, sweet: 0, healthy: 0, cream: 0 });
  /* 최종 결과 유형 (null이면 아직 게임 중) */
  const [result, setResult] = useState(null);
  /* 결과에 맞는 추천 빵집 목록 (최대 3개) */
  const [recommendedBakeries, setRecommendedBakeries] = useState([]);

  /* --- 각 유형별 대표 메뉴 키워드 --- */
  /* 이 키워드로 DB의 PLACE_MENU 테이블을 검색해서 빵집을 추천함 */
  const typeMenuMap = {
    crispy: { keywords: ['크루아상', '크로와상', '소금빵', '페이스트리'], primary: '크루아상' },
    sweet:  { keywords: ['케이크', '도넛', '머핀', '타르트', '마카롱'], primary: '케이크' },
    healthy:{ keywords: ['식빵', '바게트', '치아바타', '사워도우', '통밀'], primary: '식빵' },
    cream:  { keywords: ['크림빵', '슈크림', '에클레어', '생크림'], primary: '크림빵' },
  };

  /* --- 질문 4개 데이터 --- */
  /* 각 질문마다 2가지 유형이 대결, 4문제에서 모든 유형이 2번씩 등장 */
  const questions = [
    {
      question: 'Q1. 빵집에 들어갔을 때, 가장 먼저 눈이 가는 곳은?',
      options: [
        { emoji: '🥐', title: '겉이 바삭바삭한 빵 진열대', desc: '크루아상, 소금빵이 한가득!', type: 'crispy' },
        { emoji: '🍰', title: '알록달록 달콤한 케이크 쇼케이스', desc: '예쁜 케이크, 마카롱이 가득!', type: 'sweet' },
      ],
    },
    {
      question: 'Q2. 커피와 함께 먹을 빵 하나를 고른다면?',
      options: [
        { emoji: '🥖', title: '고소하고 담백한 빵이 좋아', desc: '바게트에 버터 한 조각이면 충분해', type: 'healthy' },
        { emoji: '🧁', title: '크림이 듬뿍 들어간 빵!', desc: '슈크림빵, 크림빵이 최고야', type: 'cream' },
      ],
    },
    {
      question: 'Q3. 친구 생일 선물로 빵을 산다면?',
      options: [
        { emoji: '🎂', title: '화려한 생크림 케이크!', desc: '크림이 넘치는 특별한 케이크', type: 'cream' },
        { emoji: '🥐', title: '고급 버터 크루아상 세트', desc: '바삭한 페이스트리 선물 세트', type: 'crispy' },
      ],
    },
    {
      question: 'Q4. 다이어트 중인데 빵이 먹고 싶다면?',
      options: [
        { emoji: '🍞', title: '통밀빵이라도 먹어야지', desc: '건강한 재료로 만든 담백한 빵', type: 'healthy' },
        { emoji: '🍩', title: '어차피 먹을 거 달콤하게!', desc: '도넛 하나쯤은 괜찮아~', type: 'sweet' },
      ],
    },
  ];

  /* --- 4가지 결과 유형 데이터 --- */
  const results = {
    crispy: {
      emoji: '🥐',
      name: '바삭장인',
      desc: '버터 풍미와 바삭한 식감을 사랑하는 당신!\n크루아상, 페이스트리, 소금빵이 인생빵이에요.\n당신을 위한 바삭한 빵집을 추천해드릴게요!',
      color: '#b45309',
    },
    sweet: {
      emoji: '🍩',
      name: '달달마스터',
      desc: '달콤한 빵 앞에서는 참을 수 없는 당신!\n케이크, 도넛, 마카롱이라면 언제든 환영이에요.\n당신을 위한 달달한 빵집을 추천해드릴게요!',
      color: '#db2777',
    },
    healthy: {
      emoji: '🍞',
      name: '건강빵러버',
      desc: '담백하고 건강한 빵을 추구하는 당신!\n통밀빵, 바게트, 치아바타가 최고예요.\n당신을 위한 건강한 빵집을 추천해드릴게요!',
      color: '#059669',
    },
    cream: {
      emoji: '🧁',
      name: '크림폭탄',
      desc: '부드러운 크림이 없으면 빵이 아닌 당신!\n슈크림빵, 크림빵, 에클레어를 사랑해요.\n당신을 위한 크림 가득 빵집을 추천해드릴게요!',
      color: '#7c3aed',
    },
  };

  /* 전체 질문 개수 */
  const totalQuestions = questions.length;

  /* --- 결과가 나오면 추천 빵집 3개 불러오기 --- */
  useEffect(() => {
    if (!result) return;

    /* 결과 유형의 대표 메뉴 키워드로 빵집 검색 */
    const menu = typeMenuMap[result].primary;

    async function fetchRecommended() {
      try {
        const res = await fetch(`${BASE_URL}/api/places?menu=${encodeURIComponent(menu)}`);
        const data = await res.json();

        /* 리뷰 많은 순으로 정렬해서 상위 3개만 가져오기 */
        const top3 = data
          .filter(p => p.LATITUDE && p.LONGITUDE)
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 3)
          .map(p => ({
            id: p.PLACE_NUM,
            name: p.PLACE_NAME,
            address: p.ADDRESS || '',
            rating: p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0',
            image: p.thumbnailImage || null,
          }));

        setRecommendedBakeries(top3);
      } catch (err) {
        console.error('추천 빵집 불러오기 실패:', err);
      }
    }

    fetchRecommended();
  }, [result]);

  /* --- 선택지를 클릭했을 때 실행되는 함수 --- */
  function handleSelect(type) {
    /* 선택한 유형에 점수 +1 */
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);

    /* 마지막 질문이면 → 결과 계산 */
    if (step + 1 >= totalQuestions) {
      /* 점수가 가장 높은 유형 찾기 */
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    }
    /* 다음 질문으로 넘어가기 */
    setStep(step + 1);
  }

  /* --- 다시하기 버튼 클릭 시 모든 상태 초기화 --- */
  function handleRetry() {
    setStep(0);
    setScores({ crispy: 0, sweet: 0, healthy: 0, cream: 0 });
    setResult(null);
    setRecommendedBakeries([]);
  }

  /* --- 추천 빵집 보러가기 (결과 유형의 대표 메뉴로 필터) --- */
  function handleExplore() {
    const menu = typeMenuMap[result].primary;
    navigate(`/places?menu=${encodeURIComponent(menu)}`);
  }

  /* --- 현재 질문 데이터 (게임 중일 때만) --- */
  const currentQ = questions[step];

  return (
    /* 빵BTI 전체 감싸는 섹션 */
    <section className="bti-section">
      <div className="bti-box">
        {/* 배경 장식용 동그라미 (예쁘게 보이려고 넣은 것) */}
        <div className="bti-deco1" />
        <div className="bti-deco2" />

        {/* 상단: MINI GAME 뱃지 + 제목 + 설명 */}
        <div className="bti-header">
          <span className="bti-badge">MINI GAME</span>
          <h2 className="bti-title">나의 빵BTI는 무엇일까?</h2>
          <p className="bti-subtitle">4가지 질문으로 알아보는 나만의 빵 유형!</p>
        </div>

        {/* ===== 게임 진행 중 (아직 결과가 안 나왔을 때) ===== */}
        {!result ? (
          <div>
            {/* 프로그레스 바 (몇 번째 질문인지 보여줌) */}
            <div className="bti-progress">
              <div className="bti-progress-bar">
                {/* 진행률에 따라 채워지는 부분 */}
                <div
                  className="bti-progress-fill"
                  style={{ width: `${(step / totalQuestions) * 100}%` }}
                />
              </div>
              {/* "1 / 4" 같은 텍스트 */}
              <span className="bti-progress-text">{step + 1} / {totalQuestions}</span>
            </div>

            {/* 질문 텍스트 */}
            <h3 className="bti-question" key={step}>
              {currentQ.question}
            </h3>

            {/* 선택지 2개 */}
            <div className="bti-options">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  className="bti-option"
                  onClick={() => handleSelect(opt.type)}
                >
                  <span className="bti-emoji">{opt.emoji}</span>
                  <div className="bti-option-title">{opt.title}</div>
                  <div className="bti-option-desc">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ===== 결과 화면 (4개 질문 다 답했을 때) ===== */
          <div className="bti-result">
            {/* 결과 이모지 */}
            <div className="bti-result-emoji">{results[result].emoji}</div>
            {/* 결과 제목 */}
            <h3 className="bti-result-title">
              당신은 확신의{' '}
              <span className="bti-result-highlight" style={{ color: results[result].color }}>
                {results[result].name}
              </span>
              !
            </h3>
            {/* 결과 설명 */}
            <p className="bti-result-desc">{results[result].desc}</p>

            {/* 내 점수 분포 (어떤 유형에 몇 점인지 막대그래프) */}
            <div className="bti-score-bars">
              {Object.entries(results).map(([key, val]) => (
                <div key={key} className="bti-score-row">
                  {/* 유형 이름 (이모지 + 이름) */}
                  <span className="bti-score-label">{val.emoji} {val.name}</span>
                  {/* 막대 그래프 */}
                  <div className="bti-score-track">
                    <div
                      className="bti-score-fill"
                      style={{
                        /* 전체 질문 수 대비 해당 유형 점수 비율 */
                        width: `${(scores[key] / totalQuestions) * 100}%`,
                        background: val.color,
                      }}
                    />
                  </div>
                  {/* 점수 숫자 */}
                  <span className="bti-score-num">{scores[key]}</span>
                </div>
              ))}
            </div>

            {/* ===== 추천 빵집 미리보기 (최대 3개) ===== */}
            {recommendedBakeries.length > 0 && (
              <div className="bti-recommend">
                <p className="bti-recommend-title">
                  {results[result].emoji} {results[result].name}을 위한 추천 빵집
                </p>
                <div className="bti-recommend-list">
                  {recommendedBakeries.map((b) => (
                    <div
                      key={b.id}
                      className="bti-recommend-card"
                      onClick={() => navigate(`/place/${b.id}`)}
                    >
                      {/* 빵집 사진 (없으면 빵 이모지) */}
                      <div className="bti-recommend-img">
                        {b.image ? (
                          <img
                            src={b.image.startsWith('http') ? b.image : `${BASE_URL}${b.image}`}
                            alt={b.name}
                          />
                        ) : (
                          <span className="bti-recommend-placeholder">🍞</span>
                        )}
                      </div>
                      {/* 빵집 이름 + 별점 */}
                      <div className="bti-recommend-info">
                        <span className="bti-recommend-name">{b.name}</span>
                        <span className="bti-recommend-rating">⭐ {b.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼들 (다시하기 + 추천 빵집 더보기) */}
            <div className="bti-result-actions">
              <button className="bti-btn-retry" onClick={handleRetry}>
                다시하기
              </button>
              <button className="bti-btn-explore" onClick={handleExplore}>
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
