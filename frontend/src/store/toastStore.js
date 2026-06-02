import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  toast: ({ title, description, variant = 'default', duration = 4000 }) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, title, description, variant }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, duration);
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export default useToastStore;