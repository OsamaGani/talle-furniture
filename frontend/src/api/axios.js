import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // 30 s ceiling — long enough for Render free-tier cold starts to wake
  // the backend (typically 20-30 s), short enough that a flaky mobile
  // network can't leave a request hung forever holding open a connection
  // and blocking dependent Promise.all calls.
  timeout: 30_000,
});

API.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const { token } = JSON.parse(user);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// Routes that don't require auth — 401s here shouldn't trigger session logout
const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isPublic = PUBLIC_PATHS.some((p) => url.includes(p));
    if (err.response?.status === 401 && !isPublic) {
      // Notify the app — AuthContext listens and clears state + shows toast
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default API;
