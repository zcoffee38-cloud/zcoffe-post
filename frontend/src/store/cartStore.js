import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      set({ items: items.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ items: [...items, { ...product, qty: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.id !== productId) });
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.id !== productId) });
    } else {
      set({ items: get().items.map((i) => i.id === productId ? { ...i, qty } : i) });
    }
  },

  clearCart: () => set({ items: [] }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  get totalItems() {
    return get().items.reduce((sum, i) => sum + i.qty, 0);
  },
}));

export default useCartStore;