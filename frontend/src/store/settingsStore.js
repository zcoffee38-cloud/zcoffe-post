import { create } from 'zustand';
import api from '../api';

const useSettingsStore = create((set) => ({
  settings: {
    shop_name: 'Z Coffee',
    shop_address: '',
    shop_phone: '',
    receipt_footer: '',
  },
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Gagal memuat pengaturan', isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put('/settings', { settings: newSettings });
      set({ settings: data.data, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan pengaturan';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },
}));

export default useSettingsStore;
