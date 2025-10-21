import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://167.172.231.242:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // 如果 token 存在，添加到请求头
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
    // 直接返回响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 处理错误
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，可能需要重新登录
          console.error("未授权，请重新登录");
          // 可以在这里添加重定向到登录页面的逻辑
          break;
        case 403:
          // 禁止访问
          console.error("没有权限访问该资源");
          break;
        case 404:
          // 资源不存在
          console.error("请求的资源不存在");
          break;
        case 500:
          // 服务器错误
          console.error("服务器错误");
          break;
        default:
          console.error(`请求错误: ${error.response.status}`);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error("网络错误，无法连接到服务器");
    } else {
      // 请求配置有误
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

// 导出 axios 实例
export default instance;
