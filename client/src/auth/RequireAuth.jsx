import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
    const token = localStorage.getItem('access_token');
    const location = useLocation();
    if (!token) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }
    return <Outlet />;
}
