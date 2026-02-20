import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.hypercopy.io",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error("未授权，请重新登录");
          break;
        case 403:
          console.error("没有权限访问该资源");
          break;
        case 404:
          console.error("请求的资源不存在");
          break;
        case 500:
          console.error("服务器错误");
          break;
        default:
          console.error(`请求错误: ${error.response.status}`);
      }
    } else if (error.request) {
      console.error("网络错误，无法连接到服务器");
    } else {
      console.error("请求配置错误:", error.message);
    }
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export const get = <T>(
  url: string,
  params?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.get(url, { params, ...config });
};

// 封装 POST 请求
export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.post(url, data, config);
};

// 封装 PUT 请求
export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.put(url, data, config);
};

// 封装 DELETE 请求
export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.delete(url, config);
};

// 封装 PATCH 请求
export const patch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  return instance.patch(url, data, config);
};

// 导出 axios 实例
export default instance;