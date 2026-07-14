import { create } from 'zustand';
import {
  evaluatePermission,
  evaluateAnyPermission,
  evaluateAllPermissions,
} from '@/utils/permissions';

export const usePermissionStore = create((set, get) => ({
  permissions: new Set(),
  role: null,

  setPermissions: (permissions, role) => {
    set({ permissions: new Set(permissions), role });
  },

  clearPermissions: () => set({ permissions: new Set(), role: null }),

  hasPermission: (key) => evaluatePermission(get().permissions, key),

  hasAnyPermission: (keys) => evaluateAnyPermission(get().permissions, keys),

  hasAllPermissions: (keys) => evaluateAllPermissions(get().permissions, keys),
}));
