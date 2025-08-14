import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];
let isRedirecting = false;

function processQueue(error, access = null) {
  queue.forEach(p => access ? p.resolve(access) : p.reject(error));
  queue = [];
}

http.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original?._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({
              resolve: (access) => {
                original.headers.Authorization = `Bearer ${access}`;
                resolve(http(original));
              },
              reject
            });
          });
        }
        isRefreshing = true;
        try {
          const { data } = await axios.post('/api/token/refresh/', { refresh });
          localStorage.setItem('access', data.access);
          isRefreshing = false;
          processQueue(null, data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return http(original);
        } catch (e) {
          isRefreshing = false;
          processQueue(e, null);
          localStorage.removeItem('access'); 
          localStorage.removeItem('refresh');
          // ⛔ pas de boucle : ne redirige pas si on est déjà sur /login
          if (!isRedirecting && !window.location.pathname.startsWith('/login')) {
            isRedirecting = true;
            window.location.replace('/login');
          }
          return Promise.reject(e);
        }
      } else {
        // Pas de refresh : on ne boucle pas
        localStorage.removeItem('access'); 
        localStorage.removeItem('refresh');
        if (!isRedirecting && !window.location.pathname.startsWith('/login')) {
          isRedirecting = true;
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default http;
