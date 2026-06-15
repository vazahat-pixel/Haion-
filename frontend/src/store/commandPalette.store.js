import { create } from 'zustand';
import { getStorageItem, setStorageItem } from '@/utils/storage';

const MAX_RECENT = 10;

export const useCommandPaletteStore = create((set, get) => ({
  isOpen: false,
  query: '',
  recentCommands: getStorageItem('command-palette:recent') ?? [],
  activeIndex: 0,

  open: () => set({ isOpen: true, query: '', activeIndex: 0 }),

  close: () => set({ isOpen: false, query: '', activeIndex: 0 }),

  toggle: () => {
    const { isOpen } = get();
    if (isOpen) get().close();
    else get().open();
  },

  setQuery: (query) => set({ query, activeIndex: 0 }),

  setActiveIndex: (activeIndex) => set({ activeIndex }),

  addRecent: (command) => {
    const recent = [command, ...get().recentCommands.filter((c) => c.id !== command.id)].slice(0, MAX_RECENT);
    setStorageItem('command-palette:recent', recent);
    set({ recentCommands: recent });
  },

  clearRecent: () => {
    setStorageItem('command-palette:recent', []);
    set({ recentCommands: [] });
  },
}));
