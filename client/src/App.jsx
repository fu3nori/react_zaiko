import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Top from './pages/Top';
import Zaiko from './pages/Zaiko';
import Master from './pages/Master';
import Journal from './pages/Journal';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Top />} />
                <Route path="/zaiko" element={<Zaiko />} />
                <Route path="/master" element={<Master />} />
                <Route path="/journal" element={<Journal />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
