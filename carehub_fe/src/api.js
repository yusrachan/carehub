import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_BASE });

let isRefreshing = false;
let subscribers = [];

function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}
function addSubscriber(cb) {
  subscribers.push(cb);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const officeId = localStorage.getItem("current_office_id");
  if (officeId) config.headers["X-Office-Id"] = officeId;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: originalRequest } = error;

    if (!response || response.status !== 401) return Promise.reject(error);

    const isRefreshCall = originalRequest?.url?.endsWith("/auth/token/refresh/");
    const refreshToken = localStorage.getItem("refresh_token");
    if (isRefreshCall || !refreshToken) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        addSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await api.post("/auth/token/refresh/", { refresh: refreshToken });
      const newAccess = data.access || data.access_token;
      localStorage.setItem("access_token", newAccess);

      isRefreshing = false;
      onRefreshed(newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      isRefreshing = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return Promise.reject(err);
    }
  }
);
