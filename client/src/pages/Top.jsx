// src/pages/Top.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Main.css';
import reactLogo from '../assets/react.svg';
import api from '../lib/api'; // ★ 追加：Bearer自動付与＆401ハンドリング

function Top() {
    // 状態管理
    const navigate = useNavigate();
    const location = useLocation();
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const from = location.state?.from?.pathname || '/zaiko'; // 認可ガードから戻る先

    // ログイン
    const handleLogin = async () => {
        try {
            const { data } = await api.post('/login', {
                email: loginEmail,
                password: loginPassword,
            });
            // JWT を保存（以降のAPIはinterceptorが自動でBearer付与）
            localStorage.setItem('access_token', data.token);
            // UI用途でユーザーID使いたい場合は任意保存
            if (data.user?.id) localStorage.setItem('user_id', String(data.user.id));

            navigate(from, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || 'ログインに失敗しました';
            console.error(msg);
            alert(msg);
        }
    };

    // 新規登録
    const handleRegister = async () => {
        try {
            const { data } = await api.post('/register', {
                email: registerEmail,
                password: registerPassword,
            });
            // 登録時もトークンが返る仕様に合わせる
            if (data.token) localStorage.setItem('access_token', data.token);
            if (data.user_id) localStorage.setItem('user_id', String(data.user_id));

            setRegisterEmail('');
            setRegisterPassword('');
            navigate('/zaiko');
        } catch (err) {
            const msg = err?.response?.data?.message || 'アカウント作成に失敗しました';
            console.error(msg);
            alert(msg);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div className="centering">
                <h1 className="title">在庫くん</h1>
                <p className="title">在庫くんは倉庫の在庫の管理と入出庫履歴の記録が出来る無料ウェブサービスです</p>

                <div className="left">
                    {/* ログインフォーム */}
                    <h2 className="title">ログイン</h2>
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                    /><br />
                    <input
                        type="password"
                        placeholder="パスワード"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                    /><br /><br />
                    <button onClick={handleLogin}>ログイン</button>
                </div>

                <div className="right">
                    {/* 登録フォーム */}
                    <h2 className="title">新規登録</h2>
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                    /><br />
                    <input
                        type="password"
                        placeholder="パスワード"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                    /><br /><br />
                    <button onClick={handleRegister}>アカウント作成</button>
                </div>
            </div>

            <div style={{ clear: 'both' }} />
            <div style={{ marginTop: 8, marginLeft: "40%" }}>
                <a href="/legal"><strong>利用規約（必ずお読みください）</strong></a>
            </div>
            <div style={{ marginTop: 8, marginLeft: "40%" }}>
                <a href="/forgot"><strong>パスワードをお忘れですか？</strong></a>
            </div>
            <div className="footer" style={{ marginTop: 8, marginLeft: "80%" }}>
                <p className="title" style={{ textAlign: 'center' }}>
                    Powered by React and Vite<br />
                    <img src={reactLogo} width="50" alt="React logo" />
                </p>
            </div>
        </div>

    );
}

export default Top;
