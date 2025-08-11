import { useEffect } from 'react';
import { getToken } from '../lib/authToken';
import api from '../lib/api';

export default function useAuthGate({ alertTest = true } = {}) {
    useEffect(() => {
        const t = getToken();
        if (t) {
            if (alertTest) alert('OK!');
        } else {
            if (alertTest) alert('NG!');
            // ここで必要なら: window.location.assign('/login');
        }
    }, []);
}
