import { create } from 'zustand';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export const useSidebarStore = create((set, get) => ({
  isCollapsed: getStorageItem('sidebar:collapsed') ?? false,
  isMobileOpen: false,
  activeItem: null,
  pinnedItems: getStorageItem('sidebar:pinned') ?? [],
  hoverItem: null,

  toggleCollapse: () => {
    const next = !get().isCollapsed;
    setStorageItem('sidebar:collapsed', next);
    set({ isCollapsed: next });
  },

  setCollapsed: (isCollapsed) => {
    setStorageItem('sidebar:collapsed', isCollapsed);
    set({ isCollapsed });
  },

  toggleMobile: () => set({ isMobileOpen: !get().isMobileOpen }),

  setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),

  setActiveItem: (activeItem) => set({ activeItem }),

  pin: (itemId) => {
    const pinned = [...new Set([...get().pinnedItems, itemId])];
    setStorageItem('sidebar:pinned', pinned);
    set({ pinnedItems: pinned });
  },

  unpin: (itemId) => {
    const pinned = get().pinnedItems.filter((id) => id !== itemId);
    setStorageItem('sidebar:pinned', pinned);
    set({ pinnedItems: pinned });
  },

  setHoverItem: (hoverItem) => set({ hoverItem }),
}));
