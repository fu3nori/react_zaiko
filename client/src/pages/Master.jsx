import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Main.css';
import api from '../lib/api';
import useAuthGate from '../hooks/useAuthGate';
function Master() {
    const navigate = useNavigate();
    const [itemName, setItemName] = useState('');
    const [initialQuantity, setInitialQuantity] = useState('');

    const handleRegister = async () => {
        try {
        await api.post('/items', {
        name: itemName,
        quantity: Number(initialQuantity) || 0,
        });
        setItemName('');
        setInitialQuantity('');
        navigate('/zaiko');
    } catch (err) {
        alert(err.message || '登録に失敗しました');
    }

    };
    useAuthGate();
    return (
        <div style={{ padding: '2rem' }}>
            <h2 className="title">商品マスター登録画面</h2>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="商品名"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    style={{ marginRight: '1rem' }}
                />
                <input
                    type="number"
                    placeholder="初期個数"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    style={{ marginRight: '1rem' }}
                />
                <button onClick={handleRegister}>登録</button>
            </div>

            <button onClick={() => navigate('/zaiko')}>在庫管理に戻る</button>
        </div>
    );
}

export default Master;
