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

          <div className="footer-company">
            <div className="footer-brand">오븐로드</div>
            <div className="footer-info">
              <p>대표자명 : 홍길동</p>
              <p>사업자등록번호 : 000-00-00000</p>
              <p>이메일 : google@google.com</p>
              <p>주소 : 서울특별시 OOO구 OOO로 OO번길 OOO-O</p>
            </div>
          </div>

          <div className="footer-link-group">
            <ul className="footer-links">
              <li><Link to="/">소개</Link></li>
              <li><Link to="/notice?tab=qna">문의하기</Link></li>
              <li>제휴제안</li>
              <li>찾아오시는 길</li>
            </ul>
          </div>

          <div className="footer-link-group">
            <ul className="footer-links">
              <li><Link to="/notice">공지사항</Link></li>
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>쿠키 정책</li>
              <li>자주 묻는 질문</li>
            </ul>
          </div>

          <div className="footer-sns">
            <div className="footer-sns-row">
              <button className="footer-sns-btn" title="Instagram"></button>
              <button className="footer-sns-btn" title="YouTube"></button>
              <button className="footer-sns-btn" title="Blog"></button>
              <button className="footer-sns-btn" title="Twitter"></button>
            </div>
          </div>

        </div>

        <div className="footer-copyright"></div>

      </div>
    </footer>
  );
}
