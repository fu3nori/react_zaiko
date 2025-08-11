// client/src/lib/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';
const api = axios.create({ baseURL });

// 複数キー & local/session 両対応で取得
const TOKEN_KEYS = ['token', 'access_token'];
const getToken = () => {
    for (const k of TOKEN_KEYS) {
        const v = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (v) return v;
    }
    return null;
};

// リクエストに Bearer 自動付与（"Bearer " 重複も回避）
api.interceptors.request.use((config) => {
    const t = getToken();
    if (t) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = t.startsWith('Bearer ') ? t : `Bearer ${t}`;
    }
    return config;
});

// 401なら全ストレージのトークンを掃除してトップへ
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            TOKEN_KEYS.forEach((k) => {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            });
            window.location.assign('/'); // /loginにしたければここを変更
        }
        return Promise.reject(err);
    }
);

export default api;
