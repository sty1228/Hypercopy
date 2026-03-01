/**
 * Token storage with localStorage + cookie fallback.
 * iOS Safari in-app browsers and private mode may block localStorage.
 */

const TOKEN_KEY = "token";
const COOKIE_MAX_AGE = 60 * 60 * 72; // 72h — matches JWT_EXPIRE_HOURS

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
  // Always write to cookie (universal fallback)
  cookieSet(TOKEN_KEY, token);
  // Also write to localStorage if available
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