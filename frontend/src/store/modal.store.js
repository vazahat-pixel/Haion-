import { create } from 'zustand';

let modalId = 0;

export const useModalStore = create((set, get) => ({
  stack: [],

  open: (component, props = {}, options = {}) => {
    const id = `modal-${++modalId}`;
    set({ stack: [...get().stack, { id, component, props, options: { closable: true, size: 'md', ...options } }] });
    return id;
  },

  close: (id) => set({ stack: get().stack.filter((m) => m.id !== id) }),

  closeTop: () => set({ stack: get().stack.slice(0, -1) }),

  closeAll: () => set({ stack: [] }),

  updateProps: (id, props) => {
    set({
      stack: get().stack.map((m) => (m.id === id ? { ...m, props: { ...m.props, ...props } } : m)),
    });
  },
}));
