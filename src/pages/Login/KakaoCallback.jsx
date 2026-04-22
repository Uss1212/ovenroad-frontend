/* ===================================================
   KakaoCallback 컴포넌트 (카카오 로그인 후 돌아오는 페이지)
   - 카카오 로그인이 끝나면 이 페이지로 옴
   - URL에 들어있는 사용자 정보를 꺼내서 localStorage에 저장
   - 저장 끝나면 자동으로 메인 페이지로 이동!
   =================================================== */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function KakaoCallback() {
  /* 페이지 이동 도구 */
  const navigate = useNavigate();
  /* URL의 ?뒤에 있는 값을 가져오는 도구 */
  const [searchParams] = useSearchParams();

  useEffect(() => {
    /* URL에서 user 정보 꺼내기 */
    const userData = searchParams.get('user');
    /* URL에서 에러 정보 꺼내기 */
    const error = searchParams.get('error');

    if (error) {
      /* 에러가 있으면 → 로그인 페이지로 돌려보냄 */
      alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login');
      return;
    }

    if (userData) {
      try {
        /* JSON 문자열을 객체로 변환 */
        const user = JSON.parse(decodeURIComponent(userData));
        /* JWT 토큰 저장 */
        const tokenData = searchParams.get('token');
        if (tokenData) localStorage.setItem('token', tokenData);
        /* localStorage에 사용자 정보 저장 */
        localStorage.setItem('user', JSON.stringify(user));
        /* 메인 페이지로 이동! */
        navigate('/');
      } catch (e) {
        alert('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    } else {
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
      카카오 로그인 처리 중...
    </div>
  );
}
