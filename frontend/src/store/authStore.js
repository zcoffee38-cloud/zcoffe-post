import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('zcoffee_user') || 'null'),
  token: localStorage.getItem('zcoffee_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user } = data.data;
      localStorage.setItem('zcoffee_token', token);
      localStorage.setItem('zcoffee_user', JSON.stringify(user));
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('zcoffee_token');
    localStorage.removeItem('zcoffee_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;