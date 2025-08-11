import { useEffect } from 'react';
import { getToken } from '../lib/authToken';
import api from '../lib/api';

export default function useAuthGate({ alertTest = true } = {}) {
    useEffect(() => {
        const t = getToken();
        if (t) {
            console.log("ログイン成功");
        } else {
            if (alertTest) alert('NG!');
            window.location.assign('/');
            // ここで必要なら: window.location.assign('/login');
        }
    }, []);
}
