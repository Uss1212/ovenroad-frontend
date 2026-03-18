/* ===================================================
   Footer 컴포넌트 (푸터)
   - 모든 페이지 맨 아래에 들어가는 공통 컴포넌트
   - 왼쪽: 오븐로드 회사 정보 (대표, 사업자번호, 이메일, 주소)
   - 가운데: 소개 링크 + 고객지원 링크
   - 오른쪽: SNS 아이콘들
   - 맨 아래: 저작권 문구
   =================================================== */

import './Footer.css'; // Footer 전용 스타일(CSS)을 불러옴

export default function Footer() {
  return (
    // footer 태그: 페이지 맨 아래 영역
    <footer className="footer">

      {/* ---- 푸터 안쪽 내용을 감싸는 컨테이너 ---- */}
      <div className="footer-inner">

        {/* ---- 상단 영역: 4개 컬럼으로 나눔 ---- */}
        <div className="footer-columns">

          {/* ===== 1번 컬럼: 회사 정보 ===== */}
          <div className="footer-company">
            {/* 브랜드 이름 */}
            <div className="footer-brand">오븐로드</div>
            {/* 회사 상세 정보 */}
            <div className="footer-info">
              <p>대표이사 : 홍길동</p>
              <p>사업자등록번호 : 000-00-00000</p>
              <p>이메일 : ooo@ovenroad.com</p>
              <p>주소 : 서울특별시 OOO구 OOO로 000-0</p>
            </div>
          </div>

          {/* ===== 2번 컬럼: 소개 링크 ===== */}
          <div className="footer-link-group">
            {/* 컬럼 제목 */}
            <div className="footer-link-title">소개</div>
            {/* 링크 목록 (나중에 <a> 태그나 라우터 Link로 교체) */}
            <ul className="footer-links">
              <li>공지사항</li>
              <li>만나주세요, 글</li>
            </ul>
          </div>

          {/* ===== 3번 컬럼: 고객지원 링크 ===== */}
          <div className="footer-link-group">
            <div className="footer-link-title">고객지원</div>
            <ul className="footer-links">
              <li>이용약관/개인정보처리방침</li>
              <li>문의하기</li>
            </ul>
          </div>

          {/* ===== 4번 컬럼: SNS 아이콘들 ===== */}
          <div className="footer-sns">
            {/* 4개의 SNS 버튼을 동그란 아이콘으로 표시 */}
            {[1, 2, 3, 4].map((i) => (
              <button key={i} className="footer-sns-btn">
                {/* 나중에 실제 SNS 아이콘으로 교체 */}
                <div className="footer-sns-icon" />
              </button>
            ))}
          </div>

        </div>

        {/* ---- 하단 영역: 저작권 문구 ---- */}
        <div className="footer-copyright">
          © 2025 오븐로드. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
