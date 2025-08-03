import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Top from './pages/Top';
import Zaiko from './pages/Zaiko';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Top />} />
                <Route path="/zaiko" element={<Zaiko />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
