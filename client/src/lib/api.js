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
// client/src/lib/api.js の 401 ハンドラを差し替え
const PUBLIC_PATHS = new Set(['/', '/legal', '/forgot', '/reset', '/register', '/login']);

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            // 公開ページではリダイレクトしない
            const here = window.location.pathname;
            if (!PUBLIC_PATHS.has(here)) {
                ['token','access_token'].forEach((k) => {
                    localStorage.removeItem(k);
                    sessionStorage.removeItem(k);
                });
                window.location.assign('/'); // ここは /login にしてもOK
            }
        }
        return Promise.reject(err);
    }
);

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
