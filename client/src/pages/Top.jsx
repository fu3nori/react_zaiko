import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
function Top() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // true=ログイン, false=アカウント作成
    const navigate = useNavigate();

    const handleSubmit = async () => {
        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            console.log(`${isLogin ? 'ログイン' : '登録'}成功:`, data);
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
            <h2 className="title">
                {isLogin ? 'ログイン' : 'アカウント作成'}</h2>
            <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            /><br />
            <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            /><br />
            <button onClick={handleSubmit}>{isLogin ? 'ログイン' : 'アカウント作成'}</button>
            <p className="title">
                {isLogin ? 'アカウントをお持ちでない方は' : '既に登録済みの方は'}{' '}
                <button onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? '新規登録' : 'ログイン'}
                </button>
            </p>
          </div>
        </div>
    );
}

export default Top;
