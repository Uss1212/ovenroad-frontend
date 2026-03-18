/* ===================================================
   CommunityWrite 컴포넌트 (커뮤니티 글쓰기 페이지)
   - 커뮤니티에 새 글을 작성하는 페이지
   - 구성:
     1) 뒤로가기 버튼 + 페이지 제목
     2) 카테고리 선택 (자유, 후기, 질문, 꿀팁, 모임)
     3) 제목 입력
     4) 본문 입력 (여러 줄)
     5) 이미지 첨부 (미리보기)
     6) 등록 / 취소 버튼
   =================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunityWrite.css';

export default function CommunityWrite() {

  /* --- 페이지 이동 도구 --- */
  const navigate = useNavigate();

  /* --- 상태(state) 관리 --- */

  /* 선택한 카테고리 (기본값: 없음) */
  const [category, setCategory] = useState('');

  /* 글 제목 */
  const [title, setTitle] = useState('');

  /* 글 본문 내용 */
  const [content, setContent] = useState('');

  /* 첨부한 이미지 목록 (미리보기용 URL 배열) */
  const [images, setImages] = useState([]);

  /* 등록 중인지 여부 (중복 클릭 방지) */
  const [submitting, setSubmitting] = useState(false);

  /* --- 카테고리 목록 --- */
  /* 사용자가 글의 종류를 선택할 수 있는 카테고리들 */
  const categories = [
    { name: '자유', icon: '💬', desc: '자유롭게 이야기해요' },
    { name: '후기', icon: '⭐', desc: '빵집/코스 후기를 남겨요' },
    { name: '질문', icon: '❓', desc: '궁금한 점을 물어봐요' },
    { name: '꿀팁', icon: '🍯', desc: '유용한 팁을 공유해요' },
    { name: '모임', icon: '👥', desc: '빵투어 모임을 모집해요' },
  ];

  /* --- 카테고리별 색상 --- */
  /* Community.jsx, CommunityDetail.jsx와 동일한 색상 */
  const getCategoryColor = (cat) => {
    const colors = {
      '자유': '#3b82f6',
      '후기': '#f59e0b',
      '질문': '#8b5cf6',
      '꿀팁': '#22c55e',
      '모임': '#ec4899',
    };
    return colors[cat] || '#888888';
  };

  /* --- 이미지 첨부 함수 --- */
  /* 파일 선택(input)에서 이미지를 고르면 실행 */
  const handleImageAdd = (e) => {
    /* 선택한 파일들을 배열로 변환 */
    const files = Array.from(e.target.files);

    /* 최대 5장까지만 허용 */
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 첨부할 수 있어요!');
      return;
    }

    /* 각 파일을 미리보기 URL로 변환 */
    /* URL.createObjectURL: 파일을 브라우저에서 바로 볼 수 있는 임시 URL로 만듦 */
    const newImages = files.map((file) => ({
      file,                                  /* 원본 파일 (나중에 서버에 업로드할 때 사용) */
      preview: URL.createObjectURL(file),    /* 미리보기용 임시 URL */
    }));

    /* 기존 이미지 목록에 새 이미지 추가 */
    setImages([...images, ...newImages]);

    /* input 값을 초기화 (같은 파일 다시 선택 가능하게) */
    e.target.value = '';
  };

  /* --- 이미지 삭제 함수 --- */
  /* 미리보기에서 X 버튼을 누르면 해당 이미지 제거 */
  const handleImageRemove = (index) => {
    /* URL.revokeObjectURL: 더 이상 안 쓰는 미리보기 URL을 메모리에서 해제 */
    URL.revokeObjectURL(images[index].preview);

    /* 해당 인덱스의 이미지를 빼고 새 배열 만들기 */
    setImages(images.filter((_, i) => i !== index));
  };

  /* --- 글 등록 함수 --- */
  /* "등록" 버튼을 누르면 실행 */
  const handleSubmit = () => {
    /* 필수 항목 검증: 카테고리, 제목, 내용이 모두 있어야 함 */
    if (!category) {
      alert('카테고리를 선택해주세요!');
      return;
    }
    if (!title.trim()) {
      alert('제목을 입력해주세요!');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요!');
      return;
    }

    /* 중복 클릭 방지 */
    setSubmitting(true);

    /* ==============================
       여기에 나중에 백엔드 API 호출 코드가 들어갈 자리
       예: await fetch('/api/community', {
             method: 'POST',
             body: JSON.stringify({ category, title, content, images })
           });
       ============================== */

    /* 지금은 임시로 알림만 띄우고 커뮤니티 목록으로 이동 */
    alert('글이 등록되었어요! (백엔드 연결 후 실제 저장됩니다)');
    navigate('/community');
  };

  /* --- 제목 글자 수 제한 (최대 50자) --- */
  const maxTitleLength = 50;

  /* --- 본문 글자 수 제한 (최대 2000자) --- */
  const maxContentLength = 2000;

  return (
    <div className="community-write">

      {/* ===== 1. 상단 네비게이션 ===== */}
      <div className="cw-top-bar">
        {/* 뒤로가기 버튼 */}
        <button
          className="cw-back-btn"
          onClick={() => navigate('/community')}
        >
          ← 돌아가기
        </button>
        {/* 페이지 제목 */}
        <h1 className="cw-page-title">글쓰기</h1>
        {/* 오른쪽 빈 공간 (가운데 정렬용) */}
        <div className="cw-top-spacer" />
      </div>

      {/* ===== 2. 카테고리 선택 ===== */}
      <div className="cw-section">
        <label className="cw-label">카테고리 선택 <span className="cw-required">*</span></label>
        <p className="cw-hint">글의 종류를 선택해주세요</p>
        <div className="cw-category-list">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`cw-category-btn ${category === cat.name ? 'active' : ''}`}
              style={
                category === cat.name
                  ? {
                      borderColor: getCategoryColor(cat.name),
                      background: getCategoryColor(cat.name) + '10',
                      color: getCategoryColor(cat.name),
                    }
                  : {}
              }
              onClick={() => setCategory(cat.name)}
            >
              {/* 카테고리 아이콘 */}
              <span className="cw-category-icon">{cat.icon}</span>
              {/* 카테고리 이름 */}
              <span className="cw-category-name">{cat.name}</span>
              {/* 카테고리 설명 */}
              <span className="cw-category-desc">{cat.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 3. 제목 입력 ===== */}
      <div className="cw-section">
        <label className="cw-label">
          제목 <span className="cw-required">*</span>
          {/* 글자 수 카운터 */}
          <span className="cw-char-count">
            {title.length}/{maxTitleLength}
          </span>
        </label>
        <input
          type="text"
          className="cw-title-input"
          placeholder="제목을 입력해주세요"
          value={title}
          /* 글자 수 제한: 최대 50자까지만 입력 가능 */
          onChange={(e) => {
            if (e.target.value.length <= maxTitleLength) {
              setTitle(e.target.value);
            }
          }}
        />
      </div>

      {/* ===== 4. 본문 입력 ===== */}
      <div className="cw-section">
        <label className="cw-label">
          내용 <span className="cw-required">*</span>
          {/* 글자 수 카운터 */}
          <span className="cw-char-count">
            {content.length}/{maxContentLength}
          </span>
        </label>
        <textarea
          className="cw-content-textarea"
          placeholder="빵에 대한 이야기를 자유롭게 작성해주세요..."
          value={content}
          /* 글자 수 제한: 최대 2000자까지만 입력 가능 */
          onChange={(e) => {
            if (e.target.value.length <= maxContentLength) {
              setContent(e.target.value);
            }
          }}
        />
      </div>

      {/* ===== 5. 이미지 첨부 ===== */}
      <div className="cw-section">
        <label className="cw-label">이미지 첨부</label>
        <p className="cw-hint">최대 5장까지 첨부할 수 있어요 (JPG, PNG)</p>

        {/* 이미지 미리보기 + 추가 버튼 */}
        <div className="cw-image-list">
          {/* 이미 첨부한 이미지들의 미리보기 */}
          {images.map((img, index) => (
            <div key={index} className="cw-image-item">
              {/* 미리보기 이미지 */}
              <img src={img.preview} alt={`첨부 ${index + 1}`} className="cw-image-preview" />
              {/* X 삭제 버튼 */}
              <button
                className="cw-image-remove"
                onClick={() => handleImageRemove(index)}
              >
                ✕
              </button>
              {/* 첫 번째 이미지에 "대표" 뱃지 */}
              {index === 0 && <span className="cw-image-main-badge">대표</span>}
            </div>
          ))}

          {/* 이미지 추가 버튼 (5장 미만일 때만 보임) */}
          {images.length < 5 && (
            <label className="cw-image-add">
              {/* 숨겨진 파일 선택 input */}
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleImageAdd}
                style={{ display: 'none' }}
              />
              {/* + 아이콘 */}
              <span className="cw-image-add-icon">+</span>
              <span className="cw-image-add-text">사진 추가</span>
            </label>
          )}
        </div>
      </div>

      {/* ===== 6. 하단 버튼 영역 ===== */}
      <div className="cw-bottom-bar">
        {/* 취소 버튼: 커뮤니티 목록으로 돌아감 */}
        <button
          className="cw-cancel-btn"
          onClick={() => {
            /* 내용이 있으면 확인 후 이동 (실수로 뒤로가기 방지) */
            if (title || content || images.length > 0) {
              if (window.confirm('작성 중인 내용이 사라져요. 정말 나갈까요?')) {
                navigate('/community');
              }
            } else {
              navigate('/community');
            }
          }}
        >
          취소
        </button>

        {/* 등록 버튼 */}
        <button
          className="cw-submit-btn"
          onClick={handleSubmit}
          /* 등록 중이면 버튼 비활성화 (중복 클릭 방지) */
          disabled={submitting}
        >
          {submitting ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  );
}
