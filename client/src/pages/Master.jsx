import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Main.css';

function Master() {
    const navigate = useNavigate();
    const [itemName, setItemName] = useState('');
    const [initialQuantity, setInitialQuantity] = useState('');
    const user_id = localStorage.getItem('user_id');
    const handleRegister = async () => {
        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user_id,
                    name: itemName,
                    quantity: initialQuantity
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert('商品登録成功！');
            setItemName('');
            setInitialQuantity('');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

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
