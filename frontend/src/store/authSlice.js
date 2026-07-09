import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isStaff: localStorage.getItem('is_staff') === 'true',
  user: localStorage.getItem('username') ? { username: localStorage.getItem('username') } : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isStaff = action.payload.isStaff;
      state.user = action.payload.user;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('is_staff', action.payload.isStaff ? 'true' : 'false');
      localStorage.setItem('username', action.payload.user.username);
    },
    logout(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.isStaff = false;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('is_staff');
      localStorage.removeItem('username');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
