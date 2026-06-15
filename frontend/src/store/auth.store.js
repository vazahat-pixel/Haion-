import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ROLE_PANEL_MAP } from '@/constants/roles';
import { authService } from '@/services/auth.service';
import { syncPermissionsFromUser } from '@/utils/syncPermissions';

const initialState = {
  user: null,
  accessToken: null,
  panel: null,
  isAuthenticated: false,
  isInitializing: true,
  loginError: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => {
        const panel = user?.role ? ROLE_PANEL_MAP[user.role] || null : null;
        set({ user, panel, isAuthenticated: !!user });
      },

      setInitializing: (isInitializing) => set({ isInitializing }),

      clearAuth: () => set({ ...initialState, isInitializing: false }),

      login: async (credentials) => {
        set({ loginError: null });
        try {
          const { user, accessToken } = await authService.login(credentials);
          const panel = ROLE_PANEL_MAP[user.role] || null;
          const userWithPermissions = {
            ...user,
            permissions: user.permissions?.length ? user.permissions : undefined,
          };
          set({
            user: userWithPermissions,
            accessToken,
            panel,
            isAuthenticated: true,
            isInitializing: false,
            loginError: null,
          });
          syncPermissionsFromUser();
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ loginError: message });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ ...initialState, isInitializing: false });
        }
      },

      refreshToken: async () => {
        try {
          const data = await authService.refresh();
          if (!data?.user) {
            set({ ...initialState, isInitializing: false });
            return false;
          }
          const { user, accessToken } = data;
          const panel = ROLE_PANEL_MAP[user.role] || null;
          set({ user, accessToken, panel, isAuthenticated: true, isInitializing: false });
          return true;
        } catch {
          set({ ...initialState, isInitializing: false });
          return false;
        }
      },
    }),
    {
      name: 'erp:auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        panel: state.panel,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const selectUser = (state) => state.user;
export const selectRole = (state) => state.user?.role;
export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectIsInitializing = (state) => state.isInitializing;
export const selectAccessToken = (state) => state.accessToken;
export const selectPanel = (state) => state.panel;
