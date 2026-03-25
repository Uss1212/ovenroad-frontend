/* ===================================================
   NaverCallback 컴포넌트 (네이버 로그인 후 돌아오는 페이지)
   - 네이버 로그인이 끝나면 이 페이지로 옴
   - URL에 들어있는 사용자 정보를 꺼내서 localStorage에 저장
   - 저장 끝나면 자동으로 메인 페이지로 이동!
   =================================================== */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function NaverCallback() {
  /* 페이지 이동 도구 */
  const navigate = useNavigate();
  /* URL의 ?뒤에 있는 값을 가져오는 도구 */
  const [searchParams] = useSearchParams();

  useEffect(() => {
    /* URL에서 user 정보 꺼내기 */
    /* 예: /login/naver-callback?user={"userNum":1,"name":"홍길동",...} */
    const userData = searchParams.get('user');
    /* URL에서 에러 정보 꺼내기 */
    const error = searchParams.get('error');

    if (error) {
      /* 에러가 있으면 → 로그인 페이지로 돌려보냄 */
      alert('네이버 로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login');
      return;
    }

    if (userData) {
      try {
        /* JSON 문자열을 객체로 변환 */
        const user = JSON.parse(decodeURIComponent(userData));
        /* localStorage에 사용자 정보 저장 (다른 페이지에서도 사용 가능) */
        localStorage.setItem('user', JSON.stringify(user));
        /* 메인 페이지로 이동! */
        navigate('/');
      } catch (e) {
        /* 데이터가 이상하면 → 로그인 페이지로 */
        alert('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    } else {
      /* user 정보가 없으면 → 로그인 페이지로 */
      navigate('/login');
    }
  }, [searchParams, navigate]);

  /* 잠깐 보이는 로딩 화면 */
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      fontSize: '18px',
      color: '#666',
    }}>
      네이버 로그인 처리 중...
    </div>
  );
}
