/* ============================================================================
 * safeStorage — localStorage with an in-memory fallback for sandboxed iframes
 * where localStorage throws on first access (the CrazyGames test portal does
 * this for some integrations).
 * ========================================================================== */

export interface SafeStorage {
  persistent: boolean;
  get(k: string): string | null;
  set(k: string, v: string): void;
  del(k: string): void;
}

export function safeStorage(): SafeStorage {
  const mem: Record<string, string> = Object.create(null);
  try {
    localStorage.setItem('__test', '1');
    localStorage.removeItem('__test');
    return {
      persistent: true,
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      del: (k) => localStorage.removeItem(k),
    };
  } catch (_e) {
    return {
      persistent: false,
      get: (k) => mem[k] || null,
      set: (k, v) => {
        mem[k] = String(v);
      },
      del: (k) => {
        delete mem[k];
      },
    };
  }
}
