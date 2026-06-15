import { create } from 'zustand';
import { appConfig } from '@/config/app.config';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';

export const useSessionStore = create((set, get) => ({
  lastActivity: null,
  isIdle: false,
  isTabVisible: true,
  lastPath: getStorageItem('session:lastPath', sessionStorage),
  savedEmail: getStorageItem('session:email', sessionStorage),
  sessionStartTime: null,
  idleTimeoutMs: appConfig.idleTimeoutMs,

  recordActivity: () => set({ lastActivity: Date.now(), isIdle: false }),

  setIdle: (isIdle) => set({ isIdle }),

  setTabVisible: (isTabVisible) => set({ isTabVisible }),

  saveLastPath: (path) => {
    setStorageItem('session:lastPath', path, sessionStorage);
    set({ lastPath: path });
  },

  saveEmail: (email) => {
    setStorageItem('session:email', email, sessionStorage);
    set({ savedEmail: email });
  },

  clearSessionMeta: () => {
    removeStorageItem('session:lastPath', sessionStorage);
    set({ lastPath: null, lastActivity: null, isIdle: false, sessionStartTime: null });
  },

  getIdleDuration: () => {
    const { lastActivity } = get();
    if (!lastActivity) return 0;
    return Date.now() - lastActivity;
  },
}));
