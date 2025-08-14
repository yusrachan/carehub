import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

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
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: originalRequest } = error;

    // Si pas de réponse ou pas 401 -> on laisse passer
    if (!response || response.status !== 401) return Promise.reject(error);

    // Pas de refresh token -> on ne peut pas récupérer, on échoue
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      // Option: rediriger vers /login
      return Promise.reject(error);
    }

    // Évite les boucles infinies
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Si un refresh est déjà en cours, on met en file d'attente
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
      const { data } = await axios.post("/api/auth/token/refresh/", { refresh: refreshToken });
      const newAccess = data.access || data.access_token;
      localStorage.setItem("access_token", newAccess);

      isRefreshing = false;
      onRefreshed(newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      isRefreshing = false;
      // Refresh expiré -> on nettoie et on laisse échouer (ou on redirige vers /login)
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return Promise.reject(err);
    }
  }
);
