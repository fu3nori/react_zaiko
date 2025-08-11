import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api',
    withCredentials: false // Cookie使う場合はtrue
});

export default api;
