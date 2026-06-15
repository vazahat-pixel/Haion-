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

  // Only attempt cookie refresh when local state suggests a prior session.
  if (!isAuthenticated && !accessToken) {
    setInitializing(false);
    return;
  }

  try {
    await refreshToken();
    syncPermissionsFromUser();
  } catch {
    setInitializing(false);
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
