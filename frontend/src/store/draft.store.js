import { create } from 'zustand';
import { appConfig } from '@/config/app.config';
import { getStorageItem, setStorageItem } from '@/utils/storage';

const TTL = appConfig.draftTtlMs;

function loadDrafts() {
  const raw = getStorageItem('drafts') || {};
  const now = Date.now();
  const valid = {};
  Object.entries(raw).forEach(([id, draft]) => {
    if (draft.expiresAt > now) valid[id] = draft;
  });
  return valid;
}

export const useDraftStore = create((set, get) => ({
  drafts: loadDrafts(),

  saveDraft: (formId, data) => {
    const now = Date.now();
    const drafts = {
      ...get().drafts,
      [formId]: { data, savedAt: now, expiresAt: now + TTL },
    };
    setStorageItem('drafts', drafts);
    set({ drafts });
  },

  loadDraft: (formId) => {
    const draft = get().drafts[formId];
    if (!draft || draft.expiresAt < Date.now()) return null;
    return draft.data;
  },

  clearDraft: (formId) => {
    const drafts = { ...get().drafts };
    delete drafts[formId];
    setStorageItem('drafts', drafts);
    set({ drafts });
  },

  clearExpired: () => {
    const now = Date.now();
    const drafts = {};
    Object.entries(get().drafts).forEach(([id, draft]) => {
      if (draft.expiresAt > now) drafts[id] = draft;
    });
    setStorageItem('drafts', drafts);
    set({ drafts });
  },

  hasDraft: (formId) => {
    const draft = get().drafts[formId];
    return !!draft && draft.expiresAt > Date.now();
  },
}));
