import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Forgot() {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        setSending(true);
        try {
            await api.post('/password/reset-request', { email });
            // 存在有無は伏せる仕様（常に成功メッセージ）
            setMsg('もし登録があれば、リセット用メールを送信しました。受信箱をご確認ください。');
        } catch (e) {
            // 仕様上、サーバは同一応答を返すが、通信失敗などはここに来る
            setMsg('もし登録があれば、リセット用メールを送信しました。受信箱をご確認ください。');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
            <h2 className="title">パスワードをお忘れですか？</h2>
            <p className="title">登録済みのメールアドレスに、再設定用リンクをお送りします。</p>
            <p className="title">稀に再設定用リンクを記載したメールが迷惑メールフォルダに入ってしまう事がございますので届かない場合は御確認下さい。</p>

            <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
                <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: 8 }}
                />
                <div style={{ marginTop: 12 }}>
                    <button type="submit" disabled={sending}>メールを送信</button>
                    <button type="button" onClick={() => navigate('/')} style={{ marginLeft: 8 }}>
                        トップへ戻る
                    </button>
                </div>
            </form>

            {msg && <p style={{ marginTop: 12 }}><span className="title">{msg}</span></p>}
        </div>
    );
}
