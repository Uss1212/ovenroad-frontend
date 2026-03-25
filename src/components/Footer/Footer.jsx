/* ===================================================
   Footer 컴포넌트 (푸터)
   - 모든 페이지 맨 아래에 들어가는 공통 컴포넌트
   - 왼쪽: 오븐로드 회사 정보 (대표, 사업자번호, 이메일, 주소)
   - 가운데: 소개 링크 + 고객지원 링크
   - 오른쪽: SNS 아이콘들
   - 맨 아래: 저작권 문구
   =================================================== */

import { Link } from 'react-router-dom';
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
              <p>서울 빵투어 큐레이션 서비스</p>
              <p>이메일 : contact@ovenroad.com</p>
              <p>주소 : 서울특별시 마포구 와우산로 94</p>
            </div>
          </div>

          {/* ===== 2번 컬럼: 서비스 링크 ===== */}
          <div className="footer-link-group">
            {/* 컬럼 제목 */}
            <div className="footer-link-title">서비스</div>
            {/* 실제 페이지로 이동하는 링크들 */}
            <ul className="footer-links">
              <li><Link to="/places">빵집 목록</Link></li>
              <li><Link to="/courses">추천코스</Link></li>
              <li><Link to="/community">커뮤니티</Link></li>
            </ul>
          </div>

          {/* ===== 3번 컬럼: 고객지원 링크 ===== */}
          <div className="footer-link-group">
            <div className="footer-link-title">고객지원</div>
            <ul className="footer-links">
              <li><Link to="/notice">공지사항</Link></li>
              <li><Link to="/events">이벤트</Link></li>
            </ul>
          </div>

          {/* ===== 4번 컬럼: SNS 아이콘들 ===== */}
          <div className="footer-sns">
            <div className="footer-link-title">SNS</div>
            <div className="footer-sns-row">
              <button className="footer-sns-btn" title="Instagram">
                <span className="footer-sns-emoji">📷</span>
              </button>
              <button className="footer-sns-btn" title="YouTube">
                <span className="footer-sns-emoji">🎬</span>
              </button>
              <button className="footer-sns-btn" title="Blog">
                <span className="footer-sns-emoji">📝</span>
              </button>
            </div>
          </div>

        </div>

        {/* ---- 하단 영역: 저작권 문구 ---- */}
        <div className="footer-copyright">
          © 2025 오븐로드(OvenRoad). All rights reserved. | 캡스톤디자인 프로젝트
        </div>

      </div>
    </footer>
  );
}
