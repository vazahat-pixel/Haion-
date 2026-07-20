import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { env } from '@/config/env';
import { LoadingState } from '@/components/feedback/LoadingState';
import { syncPermissionsFromUser } from '@/utils/syncPermissions';

async function finishAuthInit() {
  const { isAuthenticated, accessToken, refreshToken, setInitializing } =
    useAuthStore.getState();

  if (env.useMockApi) {
    if (isAuthenticated) syncPermissionsFromUser();
    setInitializing(false);
    return;
  }

  // No prior session in localStorage → skip refresh immediately.
  if (!isAuthenticated && !accessToken) {
    setInitializing(false);
    return;
  }

  // Sync permissions immediately from persisted user data (prevents blank
  // pages while the refresh token roundtrip is in-flight).
  syncPermissionsFromUser();

  try {
    await refreshToken();
    syncPermissionsFromUser();
  } catch (err) {
    // Network error / server down → keep the user logged in with the
    // persisted session so that Ctrl+R doesn't force a logout.
    // Only clear auth on an explicit 401 (invalid / expired refresh token).
    const status = err?.response?.status;
    if (status === 401) {
      useAuthStore.getState().clearAuth();
    } else {
      // Non-auth error (network unreachable, 5xx, etc.) → just stop initializing.
      setInitializing(false);
    }
  }
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    const onReady = () => {
      setReady(true);
      finishAuthInit();
    };

    if (useAuthStore.persist.hasHydrated()) {
      onReady();
      return;
    }

    return useAuthStore.persist.onFinishHydration(onReady);
  }, []);

  if (!ready || isInitializing) {
    return <LoadingState message="Restoring session..." fullPage />;
  }

  return children;
}

