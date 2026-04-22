/* ===================================================
   userSlice (유저 상태 관리)
   - 로그인한 유저 정보를 전역으로 관리
   - 어떤 컴포넌트에서든 useSelector로 꺼내 쓸 수 있음
   =================================================== */

import { createSlice } from '@reduxjs/toolkit';

/* --- 초기 상태 --- */
/* localStorage에 저장된 유저 정보가 있으면 불러옴 (새로고침해도 유지) */
const savedUser = localStorage.getItem('user');

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,  /* 유저 정보 객체 */
  isLoggedIn: !!savedUser,                          /* 로그인 여부 */
};

/* --- 슬라이스 생성 --- */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /* 로그인 성공 시: 유저 정보 저장 */
    setUser(state, action) {
      state.user = action.payload;
      state.isLoggedIn = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    /* 로그아웃 시: 유저 정보 초기화 */
    clearUser(state) {
      state.user = null;
      state.isLoggedIn = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    /* 유저 정보 일부 수정 (닉네임 변경 등) */
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
});

/* 액션 내보내기 → 컴포넌트에서 dispatch(setUser(data)) 이렇게 씀 */
export const { setUser, clearUser, updateUser } = userSlice.actions;

/* 리듀서 내보내기 → store.js에서 등록 */
export default userSlice.reducer;
