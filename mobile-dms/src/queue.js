/**
 * Offline queue. Field actions (attendance, location pings, feedback, beat visits …) are stored first and sent
 * when the network is available, in the order they were made.
 *
 * - A network failure stops the flush; the item stays and is retried later.
 * - A server refusal (4xx: validation / permission) can never succeed on retry, so the item is moved to
 *   `failed` with the server's message so the user sees it instead of it silently disappearing.
 * - A server error (5xx) is retried later.
 * Storage and sender are injected so the logic is testable without a phone.
 */
export class NetworkError extends Error {
  constructor(message = 'No network') { super(message); this.network = true; }
}

const KEY = 'dms.queue.v1';
const FAILED = 'dms.queue.failed.v1';
let seq = 0;

export function createQueue(storage, sender) {
  const read = async (k) => JSON.parse((await storage.getItem(k)) || '[]');
  const write = (k, v) => storage.setItem(k, JSON.stringify(v));
  let flushing = null;

  return {
    async items() { return read(KEY); },
    async failed() { return read(FAILED); },
    async add(item) {
      const list = await read(KEY);
      const entry = { ...item, id: `${Date.now()}-${seq += 1}`, queuedAt: new Date().toISOString(), attempts: 0 };
      list.push(entry);
      await write(KEY, list);
      return entry;
    },
    async clearFailed() { await write(FAILED, []); },
    /** Send queued items in order. Returns { sent, failed, pending }. Concurrent calls share one run. */
    flush() {
      if (flushing) return flushing;
      flushing = (async () => {
        let sent = 0; let failedNow = 0;
        let list = await read(KEY);
        while (list.length) {
          const item = list[0];
          try {
            await sender(item);
            sent += 1;
            list = list.slice(1);
            await write(KEY, list);
          } catch (e) {
            if (e.network || (e.status && e.status >= 500)) {
              list[0] = { ...item, attempts: item.attempts + 1, lastError: e.message };
              await write(KEY, list);
              break;
            }
            const failed = await read(FAILED);
            failed.push({ ...item, error: e.message, failedAt: new Date().toISOString() });
            await write(FAILED, failed);
            failedNow += 1;
            list = list.slice(1);
            await write(KEY, list);
          }
        }
        return { sent, failed: failedNow, pending: list.length };
      })().finally(() => { flushing = null; });
      return flushing;
    },
  };
}
