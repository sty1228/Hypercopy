import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getToken, setToken, refreshTokenSilently } from "@/lib/token";

const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.hypercopy.io",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ──────────────────────

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh on 401 ───────────

instance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retried?: boolean;
    };

    // Only attempt refresh once per request, and only on 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried
    ) {
      // Don't retry the connect-wallet call itself (it's the refresh mechanism)
      const url = originalRequest.url || "";
      if (url.includes("/auth/connect-wallet")) {
        return Promise.reject(error);
      }

      originalRequest._retried = true;

      try {
        // FIX: refreshTokenSilently now waits up to 5s for handler registration
        const newToken = await refreshTokenSilently();

        if (newToken) {
          // Update the stored token (refreshHandler should already do this,
          // but belt-and-suspenders)
          setToken(newToken);

          // Retry the original request with the new token
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${newToken}`;
          return instance(originalRequest);
        }
      } catch {
        // Refresh failed — fall through to normal error handling
      }

      // Refresh returned null or threw — token is dead
      console.error("[axios] 401 — token refresh failed, user needs re-login");
    }

    // ── Standard error logging ────────────────────────────
    if (error.response) {
      const s = error.response.status;
      if (s === 403) console.error("没有权限访问该资源");
      else if (s === 404) console.error("请求的资源不存在");
      else if (s === 429) console.error("请求过于频繁，请稍后再试");
      else if (s >= 500) console.error("服务器错误");
      else if (s !== 401) console.error(`请求错误: ${s}`);
    } else if (error.request) {
      console.error("网络错误，无法连接到服务器");
    } else {
      console.error("请求配置错误:", error.message);
    }

    return Promise.reject(error);
  }
);

// ── Typed HTTP helpers ───────────────────────────────────

export const get = <T>(
  url: string,
  params?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.get(url, { params, ...config });
};

export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.post(url, data, config);
};

export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.put(url, data, config);
};

export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.delete(url, config);
};

export const patch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.patch(url, data, config);
};

export default instance;