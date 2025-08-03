import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
import reactLogo from '../assets/react.svg'

function Top() {
    // 状態管理
    const navigate = useNavigate();
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    // ログイン用のハンドラ
    const handleLogin = async () => {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            console.log(`ログイン成功:`, data);
            navigate('/zaiko');
        } catch (err) {
            console.error(err.message);
            alert(err.message);
        }
    };

    const handleRegister = async () => {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: registerEmail,
                    password: registerPassword
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setRegisterEmail('');
            setRegisterPassword('');
            navigate('/zaiko');
        } catch (err) {
            console.error(err.message);
            alert(err.message);
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
                    /><br />
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
                    /><br />
                    <button onClick={handleRegister}>アカウント作成</button>
                </div>
            </div>

            <div style={{ clear: 'both' }} />
            <div className="footer">
                <p className="title" style={{ textAlign: 'center' }}>
                    Powered by React and Vite<br />
                    <img src={reactLogo} width="50" alt="React logo" />
                </p>
            </div>
        </div>
    );
}

export default Top;
