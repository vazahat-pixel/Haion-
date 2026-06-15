const RETRY_DELAYS = [1000, 2000, 4000];

export async function retryRequest(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      if (status && status >= 400 && status < 500) throw error;
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[i] || 4000));
      }
    }
  }
  throw lastError;
}
