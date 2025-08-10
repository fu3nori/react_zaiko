import { Routes, Route } from 'react-router-dom';
import Top from './pages/Top';
import Zaiko from './pages/Zaiko';
import Master from './pages/Master';
import Journal from './pages/Journal';
import RequireAuth from './auth/RequireAuth';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Top />} />
            <Route element={<RequireAuth />}>
                <Route path="/zaiko" element={<Zaiko />} />
                <Route path="/master" element={<Master />} />
                <Route path="/journal" element={<Journal />} />
            </Route>
        </Routes>
    );
}

