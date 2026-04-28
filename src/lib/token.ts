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
const WALLET_KEY = "wallet_address";
const COOKIE_MAX_AGE = 60 * 60 * 72; // 72h — matches JWT_EXPIRE_HOURS

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.hypercopy.io";

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
    localStorage.removeItem(WALLET_KEY);
  }
}

// ── Wallet address (for fallback refresh path) ───────────

export function setStoredWalletAddress(address: string): void {
  if (typeof window === "undefined") return;
  if (lsAvailable()) localStorage.setItem(WALLET_KEY, address);
}

export function getStoredWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  if (lsAvailable()) return localStorage.getItem(WALLET_KEY);
  return null;
}

/**
 * Fallback refresh path used when the React-context-aware handler
 * isn't ready (cold load) or its connectWalletApi call fails.
 *
 * Reads the wallet address persisted by the previous successful
 * connect, then re-issues POST /api/auth/connect-wallet via raw
 * fetch (deliberately NOT axios — we'd recurse through the same
 * 401 interceptor).
 */
async function fallbackRefresh(): Promise<string | null> {
  const address = getStoredWalletAddress();
  if (!address) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/connect-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: address, twitter_username: null }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    if (data?.access_token) {
      setToken(data.access_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
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
 * Strategy:
 *   1. Try the React-context handler (registered by AppLayout) — uses
 *      live Privy wallet state. Wait up to 2s for it to register.
 *   2. If unavailable or returns null, fall back to a raw-fetch
 *      `connectWalletApi` using the wallet address persisted on the
 *      last successful connect. This recovers cold-load races where
 *      Privy hasn't restored its session by the time the first 401
 *      fires (iOS Safari WebView, slow networks, private mode).
 */
export async function refreshTokenSilently(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async (): Promise<string | null> => {
    // Step 1: try the registered handler (with bounded wait)
    if (!_refreshFn) {
      await waitForHandler(2000, 100);
    }
    if (_refreshFn) {
      try {
        const token = await _refreshFn();
        if (token) {
          emitTokenRefreshed();
          return token;
        }
      } catch {
        // fall through to fallback
      }
    }
    // Step 2: fallback — direct connect-wallet using stored address
    const fallback = await fallbackRefresh();
    if (fallback) {
      emitTokenRefreshed();
      return fallback;
    }
    return null;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}