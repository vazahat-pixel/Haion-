const PREFIX = 'erp:';

export function getStorageItem(key, storage = localStorage) {
  try {
    const raw = storage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStorageItem(key, value, storage = localStorage) {
  try {
    storage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function removeStorageItem(key, storage = localStorage) {
  storage.removeItem(`${PREFIX}${key}`);
}
