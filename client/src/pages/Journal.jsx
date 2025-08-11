// src/pages/Journal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthGate from '../hooks/useAuthGate';
export default function Journal() {
    const navigate = useNavigate();

    // 認証導入前の暫定：ユーザーIDをlocalStorageから取得
    const USER_ID = Number(localStorage.getItem('user_id') || 1);

    const [filters, setFilters] = useState({
        from: '',
        to: '',
        action: '',
        item: '',
        page: 1,
        pageSize: 20,
    });

    const [data, setData] = useState({ rows: [], total: 0, page: 1, pageSize: 20 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const qs = useMemo(() => {
        const p = new URLSearchParams();
        p.set('user_id', String(USER_ID));
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) p.set(k, String(v));
        });
        return p.toString();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        setErr('');
        try {
            const res = await api.get('/journal', { params: filters });
            setData(res.data);
        } catch (e) {
            setErr(e.message || '取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.page, filters.pageSize]); // 初回＋ページング変更時

    const onFilter = (e) => {
        e.preventDefault();
        setFilters((f) => ({ ...f, page: 1 }));
        fetchLogs();
    };

    const resetFilters = () =>
        setFilters({ from: '', to: '', action: '', item: '', page: 1, pageSize: 20 });

    const pageCount = Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 20)));
    useAuthGate();
    return (
        <div style={{ padding: '2rem' }}>
            {/* 画面ヘッダー行：タイトル＋戻るボタン */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <h2 className="title" style={{ margin: 0 }}>入出庫ログ</h2>
                <button onClick={() => navigate('/zaiko')}>← 在庫に戻る</button>
            </div>

            {/* フィルター */}
            <form className="filter-box" onSubmit={onFilter}>
                <label>開始日
                    <input
                        type="date"
                        value={filters.from}
                        onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                    />
                </label>
                <label>終了日
                    <input
                        type="date"
                        value={filters.to}
                        onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                    />
                </label>
                <label>商品名
                    <input
                        type="text"
                        placeholder="例: マスク"
                        value={filters.item}
                        onChange={(e) => setFilters((f) => ({ ...f, item: e.target.value }))}
                    />
                </label>
                <label>種別
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                    >
                        <option value="">すべて</option>
                        <option value="in">入庫</option>
                        <option value="out">出庫</option>
                    </select>
                </label>
                <label>件数
                    <select
                        value={filters.pageSize}
                        onChange={(e) => setFilters((f) => ({ ...f, pageSize: Number(e.target.value), page: 1 }))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
                <div className="filter-actions">
                    <button type="submit">絞り込む</button>
                    <button type="button" onClick={resetFilters}>リセット</button>
                </div>
            </form>

            {loading && <p>読み込み中…</p>}
            {err && <p style={{ color: 'crimson' }}>{err}</p>}

            {/* 一覧 */}
            <table className="log-table">
                <thead>
                <tr>
                    <th>日時</th>
                    <th>商品名</th>
                    <th className="num">数量</th>
                    <th>種別</th>
                </tr>
                </thead>
                <tbody>
                {data.rows.map((r) => (
                    <tr key={r.id}>
                        <td>{r.date?.replace('T', ' ').slice(0, 19) || r.date}</td>
                        <td>{r.item_name}</td>
                        <td className="num">{r.action === 'in' ? `+${r.quantity}` : `-${r.quantity}`}</td>
                        <td className={r.action === 'in' ? 'type-in' : 'type-out'}>
                            {r.action === 'in' ? '入庫' : '出庫'}
                        </td>
                    </tr>
                ))}
                {!loading && data.rows.length === 0 && (
                    <tr><td colSpan={4}>データがありません</td></tr>
                )}
                </tbody>
            </table>

            {/* ページャ */}
            <div className="pager">
                <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                    前へ
                </button>
                <span>{filters.page} / {pageCount}</span>
                <button
                    disabled={filters.page >= pageCount}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                    次へ
                </button>
            </div>
        </div>
    );
}
