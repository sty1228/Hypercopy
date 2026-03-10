/**
 * Token storage with localStorage + cookie fallback.
 * iOS Safari in-app browsers and private mode may block localStorage.
 *
 * NEW: refresh handler registration — allows axios interceptor to trigger
 *      a silent token refresh without importing React/Privy directly.
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
 * Called by axios 401 interceptor. Deduplicates concurrent calls —
 * multiple 401s will share a single in-flight refresh.
 * Returns the new token string, or null if refresh failed.
 */
export async function refreshTokenSilently(): Promise<string | null> {
  if (!_refreshFn) return null;

  // If a refresh is already in-flight, piggyback on it
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = _refreshFn()
    .catch(() => null)
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}