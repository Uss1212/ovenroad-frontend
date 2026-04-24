/* ===================================================
   API 유틸리티 (백엔드 서버와 통신하는 도구 모음)
   - 백엔드 서버 주소(BASE_URL)를 한 곳에서 관리
   - fetch를 감싸서 편리하게 GET, POST 요청을 보냄
   - 나중에 백엔드 서버가 준비되면 BASE_URL만 바꾸면 됨!
   =================================================== */

/* --- 백엔드 서버 주소 --- */
/* .env 파일의 VITE_API_URL에서 가져옴 (없으면 기본값 사용) */
export const BASE_URL = import.meta.env.VITE_API_URL || '';

/* --- API 요청을 보내는 공통 함수 --- */
/* url: 요청할 경로 (예: '/api/user/signup') */
/* options: fetch에 넘길 옵션 (method, body 등) */
async function request(url, options = {}) {
  try {
    /* localStorage에서 JWT 토큰 가져오기 */
    const token = localStorage.getItem('token');

    /* fetch: 브라우저가 제공하는 HTTP 요청 함수 */
    /* BASE_URL + url → 전체 주소 완성 (예: 'http://localhost:8080/api/user/signup') */
    const response = await fetch(BASE_URL + url, {
      /* Content-Type: 보내는 데이터가 JSON 형식이라고 알려줌 */
      headers: {
        'Content-Type': 'application/json',
        /* JWT 토큰이 있으면 Authorization 헤더에 추가 */
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
   아이디/비밀번호 찾기 관련 API 함수들
   =================================================== */

/* --- 아이디 찾기 --- */
/* 이메일로 가입된 아이디를 찾아줌 (일부 가려서 보여줌) */
export async function findId(email) {
  return request('/api/user/find-id', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/* --- 비밀번호 재설정 --- */
/* 이메일 인증 후, 새 비밀번호로 변경 */
export async function resetPassword(email, newPassword) {
  return request('/api/user/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
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
/* userNum: 사용자 번호, password: 비밀번호 확인용 (소셜 로그인은 없어도 됨) */
export async function deleteAccount(userNum, password) {
  return request(`/api/user/${userNum}`, {
    method: 'DELETE',
    body: JSON.stringify({ password: password || null }),
  });
}

/* ===================================================
   커뮤니티 게시판 관련 API 함수들
   =================================================== */

/* --- 게시글 목록 조회 --- */
/* category: 카테고리 필터 (전체면 안 보냄) */
/* search: 검색어 (제목이나 내용에서 검색) */
export async function getBoardList(category, search) {
  const params = [];
  if (category && category !== '전체') params.push(`category=${encodeURIComponent(category)}`);
  if (search && search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return request(`/api/board${query}`);
}

/* --- 인기 게시글 조회 --- */
/* 좋아요 많은 순 상위 5개 */
export async function getPopularPosts() {
  return request('/api/board/popular');
}

/* --- 게시글 상세 조회 --- */
/* boardNum: 게시글 번호 */
export async function getBoardDetail(boardNum) {
  return request(`/api/board/${boardNum}`);
}

/* --- 게시글 작성 --- */
/* data: { userNum, category, title, content } */
export async function createBoard(data) {
  return request('/api/board', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* --- 게시글 수정 --- */
/* data: { userNum, category, title, content, images } */
export async function updateBoard(boardNum, data) {
  return request(`/api/board/${boardNum}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/* --- 게시글 삭제 --- */
export async function deleteBoard(boardNum, userNum) {
  return request(`/api/board/${boardNum}`, {
    method: 'DELETE',
    body: JSON.stringify({ userNum }),
  });
}

/* --- 좋아요 토글 --- */
export async function toggleBoardLike(boardNum, userNum) {
  return request(`/api/board/${boardNum}/like`, {
    method: 'POST',
    body: JSON.stringify({ userNum }),
  });
}

/* --- 댓글 작성 --- */
export async function createComment(boardNum, userNum, content) {
  return request(`/api/board/${boardNum}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userNum, content }),
  });
}

/* --- 댓글 삭제 --- */
export async function deleteComment(boardNum, commentId, userNum) {
  return request(`/api/board/${boardNum}/comments/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userNum }),
  });
}

/* ===================================================
   코스 관련 API 함수들
   =================================================== */

/* --- 코스 목록 조회 --- */
/* sort: latest(최신) / popular(인기) / scrap(스크랩순) */
/* region: 지역 필터 (예: 마포구) */
export async function getCourseList(sort = 'latest', region = '') {
  let query = `?sort=${sort}`;
  if (region) query += `&region=${encodeURIComponent(region)}`;
  return request(`/api/courses${query}`);
}

/* --- 코스 상세 조회 --- */
export async function getCourseDetail(courseNum, userNum) {
  const query = userNum ? `?userNum=${userNum}` : '';
  return request(`/api/courses/${courseNum}${query}`);
}

/* --- 코스 커버 이미지 업로드 --- */
/* 이미지 파일을 서버에 올리고, 저장된 URL을 받아옴 */
export async function uploadCourseImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/courses/upload-image`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || '이미지 업로드에 실패했습니다.');
  }
  return response.json();
}

/* --- 코스 임시저장 --- */
/* 코스 작성 중 임시저장 (제목, 설명, 태그, 장소, 코멘트) */
export async function saveDraft(data) {
  return request('/api/courses/draft', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* --- 내 임시저장 목록 가져오기 --- */
export async function getMyDrafts(userNum) {
  return request(`/api/courses/drafts/${userNum}`);
}

/* --- 임시저장 수정 (기존 임시저장 덮어쓰기) --- */
export async function updateDraft(draftNum, data) {
  return request(`/api/courses/draft/${draftNum}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/* --- 임시저장 삭제 --- */
export async function deleteDraft(draftNum) {
  return request(`/api/courses/draft/${draftNum}`, {
    method: 'DELETE',
  });
}

/* --- 코스 만들기 --- */
/* data: { userNum, title, subtitle, content, places: [{ placeNum, order, memo, isThumbnail }] } */
export async function createCourse(data) {
  return request('/api/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* --- 코스 삭제 --- */
/* courseNum: 코스 번호 → 해당 코스를 삭제 */
export async function deleteCourse(courseNum) {
  return request(`/api/courses/${courseNum}`, {
    method: 'DELETE',
  });
}

/* --- 코스 좋아요 토글 --- */
export async function toggleCourseLike(courseNum, userNum) {
  return request(`/api/courses/${courseNum}/like`, {
    method: 'POST',
    body: JSON.stringify({ userNum }),
  });
}

/* --- 코스 스크랩 토글 --- */
export async function toggleCourseScrap(courseNum, userNum) {
  return request(`/api/courses/${courseNum}/scrap`, {
    method: 'POST',
    body: JSON.stringify({ userNum }),
  });
}

/* --- 코스 댓글 목록 조회 --- */
/* courseNum: 코스 번호 → 해당 코스의 댓글 + 답글 전부 가져옴 */
export async function getCourseComments(courseNum) {
  return request(`/api/courses/${courseNum}/comments`);
}

/* --- 코스 댓글 작성 --- */
/* courseNum: 코스 번호, userNum: 작성자, content: 댓글 내용 */
/* parentNum: 답글이면 부모 댓글 번호, 일반 댓글이면 안 보냄 */
export async function createCourseComment(courseNum, userNum, content, parentNum) {
  return request(`/api/courses/${courseNum}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userNum, content, parentNum: parentNum || null }),
  });
}

/* --- 코스 댓글 삭제 --- */
export async function deleteCourseComment(courseNum, commentNum, userNum) {
  return request(`/api/courses/${courseNum}/comments/${commentNum}`, {
    method: 'DELETE',
    body: JSON.stringify({ userNum }),
  });
}

/* ===================================================
   공지사항 / FAQ / 문의 관련 API 함수들
   =================================================== */

/* --- 공지사항 목록 조회 --- */
export async function getNoticeList() {
  return request('/api/notice');
}

/* --- 공지사항 상세 조회 (이전글/다음글 포함) --- */
export async function getNoticeDetail(noticeNum) {
  return request(`/api/notice/${noticeNum}`);
}

/* --- FAQ 목록 조회 --- */
export async function getFaqList() {
  return request('/api/notice/faq/list');
}

/* --- 문의 목록 조회 --- */
/* userNum을 넘기면 내 문의만, 안 넘기면 전체 */
export async function getQuestionList(userNum) {
  const query = userNum ? `?userNum=${userNum}` : '';
  return request(`/api/notice/question/list${query}`);
}

/* --- 문의 상세 + 답변 조회 --- */
export async function getQuestionDetail(questionNum) {
  return request(`/api/notice/question/${questionNum}`);
}

/* --- 문의 작성 --- */
export async function createQuestion(userNum, title, content) {
  return request('/api/notice/question', {
    method: 'POST',
    body: JSON.stringify({ userNum, title, content }),
  });
}

/* ===================================================
   이벤트 관련 API 함수들
   =================================================== */

/* --- 이벤트 목록 조회 (상태 자동 계산됨) --- */
export async function getEventList() {
  return request('/api/events');
}

/* --- 이벤트 상세 조회 --- */
export async function getEventDetail(eventNum) {
  return request(`/api/events/${eventNum}`);
}

/* ===================================================
   마이페이지 데이터 조회 API 함수들
   =================================================== */

/* --- 내가 만든 코스 목록 --- */
/* userNum: 사용자 번호 → 해당 사용자가 만든 코스 목록 */
export async function getMyCourses(userNum) {
  return request(`/api/user/${userNum}/my-courses`);
}

/* --- 내가 남긴 리뷰 목록 --- */
/* userNum: 사용자 번호 → 해당 사용자가 쓴 리뷰 목록 */
export async function getMyReviews(userNum) {
  return request(`/api/user/${userNum}/my-reviews`);
}

/* --- 좋아요한 코스 목록 --- */
/* userNum: 사용자 번호 → 좋아요 누른 코스 목록 */
export async function getLikedCourses(userNum) {
  return request(`/api/user/${userNum}/liked-courses`);
}

/* --- 스크랩한 코스 목록 --- */
/* userNum: 사용자 번호 → 스크랩한 코스 목록 */
export async function getScrapedCourses(userNum) {
  return request(`/api/user/${userNum}/scraped-courses`);
}

/* --- 내가 작성한 질문(게시글) 목록 --- */
/* userNum: 사용자 번호 → 내가 쓴 커뮤니티 글 목록 */
export async function getMyPosts(userNum) {
  return request(`/api/user/${userNum}/my-posts`);
}

/* --- 리뷰 삭제 --- */
/* reviewNum: 리뷰 번호, userNum: 작성자 번호 */
export async function deleteReview(reviewNum, userNum) {
  return request(`/api/user/reviews/${reviewNum}`, {
    method: 'DELETE',
    body: JSON.stringify({ userNum }),
  });
}
