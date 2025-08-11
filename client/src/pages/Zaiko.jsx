import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../lib/api';

import '../styles/Main.css';

function Zaiko() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [inQuantities, setInQuantities] = useState({});
    const [outQuantities, setOutQuantities] = useState({});

    const user_id = localStorage.getItem('user_id');

    const goToMaster = () => {
        navigate('/master');
    };

    const goToJournal = () => {
        navigate('/journal');
    };

    // 在庫一覧を取得
    const fetchItems = async () => {
        try {
            const res = await api.get('/items');
            setItems(res.data.items);
        } catch (err) {
            console.error('在庫取得エラー:', err);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // 入庫処理
    const handleIn = async (itemId) => {
        const quantity = parseInt(inQuantities[itemId]);
        if (!quantity || quantity <= 0) return alert('正しい入庫数を入力してください');

        try {
            await api.post('/items/in', { item_id: itemId, quantity });
            setInQuantities({ ...inQuantities, [itemId]: '' });
            fetchItems();
        } catch (err) {
            console.error('入庫エラー:', err);
        }
    };

    // 出庫処理
    const handleOut = async (itemId, currentStock) => {
        const quantity = parseInt(outQuantities[itemId]);
        if (!quantity || quantity <= 0) return alert('正しい出庫数を入力してください');
        if (quantity > currentStock) return alert('在庫数以上の出庫はできません');

        try {
            await api.post('/items/out', { item_id: itemId, quantity });
            setOutQuantities({ ...outQuantities, [itemId]: '' });
            fetchItems();
            } catch (err) {
            console.error('出庫エラー:', err);
            }

    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 className="title">在庫管理画面</h2>
            <p className="title">
                管理したい商品は
                <strong> 商品マスター登録画面 </strong>
                で登録してください。
            </p>
            <div style={{cssFloat: 'left' , marginRight:10 }}>
            <button onClick={goToMaster}>商品マスター登録へ</button>
            </div>



            <div style={{paddingLeft: 10 , margin:10}}><button onClick={goToJournal}>ジャーナル画面へ</button></div>

            <h3 style={{ marginTop: '2rem', borderBottom: '2px solid black' }} className="title">在庫一覧</h3>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                <tr style={{ borderBottom: '1px solid black' }}>
                    <th style={{ padding: '8px' }} className="title">商品名</th>
                    <th style={{ padding: '8px' }} className="title">在庫数</th>
                    <th style={{ padding: '8px' }} className="title">操作</th>
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid black' }}>
                        <td style={{ padding: '8px' }} className="title">{item.name}</td>
                        <td style={{ padding: '8px' }} className="title">{item.quantity}</td>
                        <td style={{ padding: '8px' }} className="title">
                            <label className="title">入庫: </label>
                            <input
                                type="number"
                                value={inQuantities[item.id] || ''}
                                onChange={(e) => setInQuantities({ ...inQuantities, [item.id]: e.target.value })}
                                style={{ width: '60px', marginRight: '5px' }}

                            />
                            <button className="button-small" onClick={() => handleIn(item.id)} >入庫</button>
                            <br />
                            <label className="title">出庫: </label>
                            <input
                                type="number"
                                value={outQuantities[item.id] || ''}
                                onChange={(e) => setOutQuantities({ ...outQuantities, [item.id]: e.target.value })}
                                style={{ width: '60px', marginRight: '5px' }}

                            />
                            <button className="button-small" onClick={() => handleOut(item.id, item.quantity)} >出庫</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default Zaiko;
