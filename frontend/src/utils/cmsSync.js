const STORAGE_KEY = 'haion_cms_updated';
const CHANNEL = 'haion-cms-updated';

export function notifyCmsUpdated() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({ type: 'refresh', at: Date.now() });
    bc.close();
  } catch {
    /* ignore */
  }
}

export function subscribeCmsUpdated(onRefresh) {
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) onRefresh();
  };
  window.addEventListener('storage', onStorage);

  let bc;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => onRefresh();
  } catch {
    /* ignore */
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    bc?.close();
  };
}
