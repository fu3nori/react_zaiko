import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function Reset() {
    const [sp] = useSearchParams();
    const token = sp.get('token') || '';
    const [pw1, setPw1] = useState('');
    const [pw2, setPw2] = useState('');
    const [msg, setMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) setMsg('トークンが見つかりません。メールのリンクからアクセスしてください。');
    }, [token]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        if (pw1.length < 8) return setMsg('パスワードは8文字以上で入力してください。');
        if (pw1 !== pw2) return setMsg('確認用パスワードが一致しません。');
        setSubmitting(true);
        try {
            const { data } = await api.post('/api/password/reset', { token, newPassword: pw1 });
            setMsg(data?.message || 'パスワードを更新しました。トップからログインしてください。');
        } catch (e) {
            const err = e?.response?.data?.message || 'トークンが無効または期限切れです。再度リセット依頼を行ってください。';
            setMsg(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
            <h2 className="title">パスワード再設定</h2>
            <p className="title">新しいパスワードを入力してください。</p>

            <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
                <input
                    type="password"
                    placeholder="新しいパスワード（8文字以上）"
                    value={pw1}
                    onChange={(e) => setPw1(e.target.value)}
                    required
                    style={{ width: '100%', padding: 8 }}
                /><br />
                <input
                    type="password"
                    placeholder="新しいパスワード（確認）"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    required
                    style={{ width: '100%', padding: 8, marginTop: 8 }}
                />
                <div style={{ marginTop: 12 }}>
                    <button type="submit" disabled={submitting || !token}>更新する</button>
                    <button type="button" onClick={() => navigate('/')} style={{ marginLeft: 8 }}>
                        トップへ
                    </button>
                </div>
            </form>

            {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        </div>
    );
}
