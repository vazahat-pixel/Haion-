import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  evaluatePermission,
  evaluateAnyPermission,
  evaluateAllPermissions,
} from '@/utils/permissions';

export const usePermissionStore = create(
  persist(
    (set, get) => ({
      permissions: new Set(),
      role: null,

      setPermissions: (permissions, role) => {
        set({ permissions: new Set(permissions), role });
      },

      clearPermissions: () => set({ permissions: new Set(), role: null }),

      hasPermission: (key) => evaluatePermission(get().permissions, key),

      hasAnyPermission: (keys) => evaluateAnyPermission(get().permissions, keys),

      hasAllPermissions: (keys) => evaluateAllPermissions(get().permissions, keys),
    }),
    {
      name: 'erp:permissions',
      storage: createJSONStorage(() => localStorage),
      // Serialize Set → Array for JSON storage
      partialize: (state) => ({
        permissions: [...state.permissions],
        role: state.role,
      }),
      // Deserialize Array → Set on hydration
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.permissions)) {
          state.permissions = new Set(state.permissions);
        }
      },
    }
  )
);
