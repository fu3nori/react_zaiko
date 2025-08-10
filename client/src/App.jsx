import { Routes, Route } from 'react-router-dom';
import Top from './pages/Top';
import Zaiko from './pages/Zaiko';
import Master from './pages/Master';
import Journal from './pages/Journal';
import RequireAuth from './auth/RequireAuth';
import Forgot from './pages/Forgot';  // ★ 追加
import Reset from './pages/Reset';    // ★ 追加
import Leagal from "./pages/Leagal.jsx"; // ★ 追加

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Top />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/leagal" element={<Leagal />} />
            <Route element={<RequireAuth />}>
                <Route path="/zaiko" element={<Zaiko />} />
                <Route path="/master" element={<Master />} />
                <Route path="/journal" element={<Journal />} />
            </Route>
        </Routes>
    );
}

