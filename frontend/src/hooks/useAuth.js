import { useCallback, useEffect } from 'react';
import { useAuthStore, selectUser, selectIsAuthenticated, selectIsInitializing, selectPanel } from '@/store/auth.store';
import { usePermissionStore } from '@/store/permission.store';
import { useSessionStore } from '@/store/session.store';
import { ROLE_PERMISSIONS } from '@/config/permissions.config';

export function useAuth() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitializing = useAuthStore(selectIsInitializing);
  const panel = useAuthStore(selectPanel);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setPermissions = usePermissionStore((s) => s.setPermissions);
  const clearPermissions = usePermissionStore((s) => s.clearPermissions);
  const clearSessionMeta = useSessionStore((s) => s.clearSessionMeta);

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions, user.role);
    } else if (user?.role && ROLE_PERMISSIONS[user.role]) {
      setPermissions(ROLE_PERMISSIONS[user.role], user.role);
    } else {
      clearPermissions();
    }
  }, [user, setPermissions, clearPermissions]);

  const handleLogin = useCallback(async (credentials) => {
    await login(credentials);
    return useAuthStore.getState().user;
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    clearPermissions();
    clearSessionMeta();
  }, [logout, clearPermissions, clearSessionMeta]);

  return {
    user,
    isAuthenticated,
    isInitializing,
    panel,
    login: handleLogin,
    logout: handleLogout,
    refreshToken,
  };
}
