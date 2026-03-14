/**
 * Token storage with localStorage + cookie fallback.
 * iOS Safari in-app browsers and private mode may block localStorage.
 *
 * Refresh handler registration — allows axios interceptor to trigger
 * a silent token refresh without importing React/Privy directly.
 *
 * FIX 2026-03-14: handler wait mechanism + token-refreshed event
 */

const TOKEN_KEY = "token";
const COOKIE_MAX_AGE = 60 * 60 * 72; // 72h — matches JWT_EXPIRE_HOURS

// ── Cookie helpers ───────────────────────────────────────

function cookieGet(key: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function cookieSet(key: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

function cookieRemove(key: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

function lsAvailable(): boolean {
  try {
    const k = "__ls_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// ── Token CRUD ───────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  if (lsAvailable()) {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) return t;
  }
  return cookieGet(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  cookieSet(TOKEN_KEY, token);
  if (lsAvailable()) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  cookieRemove(TOKEN_KEY);
  if (lsAvailable()) {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ── Token inspection ─────────────────────────────────────

/**
 * Decode JWT payload without verification (client-side only).
 * Returns null if token is missing or malformed.
 */
export function getTokenPayload(
  token?: string | null
): { sub: string; exp: number; iat: number } | null {
  const t = token ?? getToken();
  if (!t) return null;
  try {
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or will expire within `bufferMs`.
 * Default buffer: 10 minutes (refresh before it actually expires).
 */
export function isTokenExpired(
  token?: string | null,
  bufferMs = 10 * 60 * 1000
): boolean {
  const payload = getTokenPayload(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now() + bufferMs;
}

// ── Global event: notify listeners when token is refreshed ──

const TOKEN_REFRESHED_EVENT = "token-refreshed";

/**
 * Dispatch a global event so any component (e.g. dashboard) can
 * re-fetch data after a silent token refresh.
 */
export function emitTokenRefreshed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT));
}

/**
 * Subscribe to token-refreshed events. Returns an unsubscribe function.
 */
export function onTokenRefreshed(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TOKEN_REFRESHED_EVENT, callback);
  return () => window.removeEventListener(TOKEN_REFRESHED_EVENT, callback);
}

// ── Refresh handler (set by AppLayout, called by axios) ──

type RefreshFn = () => Promise<string | null>;

let _refreshFn: RefreshFn | null = null;
let _refreshPromise: Promise<string | null> | null = null;

/**
 * Called by AppLayout to register a refresh function that has access
 * to Privy wallet context. The function should call connectWalletApi,
 * store the new token, and return it (or null on failure).
 */
export function setRefreshHandler(fn: RefreshFn): void {
  _refreshFn = fn;
}

/**
 * Wait for the refresh handler to be registered (max waitMs).
 * Handles the race condition where axios 401 fires before AppLayout mounts.
 */
function waitForHandler(waitMs = 5000, pollMs = 100): Promise<boolean> {
  if (_refreshFn) return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const iv = setInterval(() => {
      if (_refreshFn) {
        clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start >= waitMs) {
        clearInterval(iv);
        resolve(false);
      }
    }, pollMs);
  });
}

/**
 * Called by axios 401 interceptor. Deduplicates concurrent calls —
 * multiple 401s will share a single in-flight refresh.
 * Returns the new token string, or null if refresh failed.
 *
 * FIX: If handler isn't registered yet (race condition), waits up to 5s.
 */
export async function refreshTokenSilently(): Promise<string | null> {
  // If a refresh is already in-flight, piggyback on it
  if (_refreshPromise) return _refreshPromise;

  // Wait for handler if it hasn't been registered yet
  if (!_refreshFn) {
    const ready = await waitForHandler();
    if (!ready || !_refreshFn) {
      console.warn("[token] Refresh handler not available after waiting");
      return null;
    }
  }

  _refreshPromise = _refreshFn()
    .then((token) => {
      if (token) {
        emitTokenRefreshed();
      }
      return token;
    })
    .catch(() => null)
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}