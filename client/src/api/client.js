import axios from 'axios';

const TOKEN_KEY = 'ecochain_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

// Attach the login token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired, send the user back to the login page.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      setToken(null);
      if (!location.pathname.startsWith('/login')) location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// Turn any error into a readable message for toasts.
export function errMsg(e, fallback = 'Something went wrong') {
  if (e?.code === 'ACTION_REJECTED') return 'You rejected the request in MetaMask';
  return e?.response?.data?.error || e?.shortMessage || e?.message || fallback;
}

export default api;
