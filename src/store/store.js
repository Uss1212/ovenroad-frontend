/* ===================================================
   Redux Store (전역 저장소)
   - 앱 전체에서 공유할 상태를 여기서 관리
   - 새로운 slice를 만들면 reducer에 추가하면 됨
   =================================================== */

import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    user: userReducer,    /* 유저 상태 (로그인 정보 등) */
    /* 나중에 추가할 slice들은 여기에 등록 */
  },
});

export default store;
