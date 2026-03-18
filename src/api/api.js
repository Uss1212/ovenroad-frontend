/* ===================================================
   API 유틸리티 (백엔드 서버와 통신하는 도구 모음)
   - 백엔드 서버 주소(BASE_URL)를 한 곳에서 관리
   - fetch를 감싸서 편리하게 GET, POST 요청을 보냄
   - 나중에 백엔드 서버가 준비되면 BASE_URL만 바꾸면 됨!
   =================================================== */

/* --- 백엔드 서버 주소 --- */
/* 지금은 로컬 개발 서버 주소 (Node.js Express 서버 포트: 8080) */
/* 나중에 실제 서버 배포하면 이 주소만 바꾸면 됨! */
const BASE_URL = 'http://localhost:8080';

/* --- API 요청을 보내는 공통 함수 --- */
/* url: 요청할 경로 (예: '/api/user/signup') */
/* options: fetch에 넘길 옵션 (method, body 등) */
async function request(url, options = {}) {
  try {
    /* fetch: 브라우저가 제공하는 HTTP 요청 함수 */
    /* BASE_URL + url → 전체 주소 완성 (예: 'http://localhost:8080/api/user/signup') */
    const response = await fetch(BASE_URL + url, {
      /* Content-Type: 보내는 데이터가 JSON 형식이라고 알려줌 */
      headers: {
        'Content-Type': 'application/json',
        /* 기존에 설정된 헤더가 있으면 덮어씌움 */
        ...options.headers,
      },
      /* 나머지 옵션들 (method, body 등) 그대로 전달 */
      ...options,
    });

    /* --- 응답 처리 --- */
    /* response.ok: 서버가 200번대(성공) 코드를 보냈는지 확인 */
    if (!response.ok) {
      /* 서버가 에러 메시지를 JSON으로 보냈을 수 있으니 파싱 시도 */
      const errorData = await response.json().catch(() => null);
      /* 에러 객체를 만들어서 던짐 → catch에서 잡을 수 있음 */
      const error = new Error(errorData?.message || '요청에 실패했습니다.');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    /* 성공이면 JSON 데이터를 파싱해서 돌려줌 */
    const data = await response.json();
    return data;
  } catch (error) {
    /* 네트워크 오류 등 fetch 자체가 실패한 경우 */
    /* 이미 우리가 만든 에러면 그대로 던지고, 아니면 새 에러 생성 */
    if (error.status) throw error;
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
  }
}

/* ===================================================
   회원가입 관련 API 함수들
   =================================================== */

/* --- 회원가입 요청 --- */
/* userData: { id, password, name, nickname, email } */
/* 서버에 새 회원 정보를 보내서 계정을 만듦 */
export async function signup(userData) {
  return request('/api/user/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/* --- 아이디 중복 확인 --- */
/* 입력한 아이디가 이미 다른 사람이 쓰고 있는지 확인 */
export async function checkIdDuplicate(id) {
  return request(`/api/user/check-id?id=${encodeURIComponent(id)}`);
}

/* --- 닉네임 중복 확인 --- */
/* 입력한 닉네임이 이미 다른 사람이 쓰고 있는지 확인 */
export async function checkNicknameDuplicate(nickname) {
  return request(`/api/user/check-nickname?nickname=${encodeURIComponent(nickname)}`);
}

/* --- 이메일 인증코드 전송 --- */
/* 입력한 이메일 주소로 인증번호를 보냄 */
export async function sendEmailVerification(email) {
  return request('/api/user/send-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/* --- 이메일 인증코드 확인 --- */
/* 사용자가 입력한 인증번호가 맞는지 서버에서 확인 */
export async function verifyEmailCode(email, code) {
  return request('/api/user/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/* ===================================================
   로그인 관련 API 함수들
   =================================================== */

/* --- 로그인 요청 --- */
/* 이메일과 비밀번호를 서버에 보내서 로그인 */
export async function login(id, password) {
  return request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ id, password }),
  });
}

/* ===================================================
   마이페이지 관련 API 함수들
   =================================================== */

/* --- 회원정보 조회 --- */
/* userNum: 사용자 번호 → 해당 사용자의 정보를 가져옴 */
export async function getUserInfo(userNum) {
  return request(`/api/user/${userNum}`);
}

/* --- 회원정보 수정 (닉네임 등) --- */
/* userNum: 사용자 번호, data: { nickname, email, profileImage } */
export async function updateUserInfo(userNum, data) {
  return request(`/api/user/${userNum}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/* --- 비밀번호 변경 --- */
/* userNum: 사용자 번호, currentPassword: 현재 비밀번호, newPassword: 새 비밀번호 */
export async function changePassword(userNum, currentPassword, newPassword) {
  return request(`/api/user/${userNum}/password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/* --- 회원탈퇴 --- */
/* userNum: 사용자 번호, password: 비밀번호 확인용 */
export async function deleteAccount(userNum, password) {
  return request(`/api/user/${userNum}`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}
