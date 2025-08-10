import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({ baseURL });

// リクエストにBearer自動付与
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 401ならトークン破棄してトップに戻す
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.assign('/'); // ← /login ではなくトップ
        }
        return Promise.reject(err);
    }
);

export default api;
