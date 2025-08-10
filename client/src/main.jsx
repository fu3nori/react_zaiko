import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ★ 追加
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <App />   {/* Appの中で<Routes>を使う */}
        </BrowserRouter>
    </StrictMode>
);
