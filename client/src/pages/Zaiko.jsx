import { useNavigate } from 'react-router-dom';
import '../styles/Main.css';

function Zaiko() {
    const navigate = useNavigate();

    const goToMaster = () => {
        navigate('/master');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 className="title">在庫管理画面</h2>
            <p className="title">
                管理したい商品は
                <strong> 商品マスター登録画面 </strong>
                で登録してください。
            </p>
            <button onClick={goToMaster}>商品マスター登録へ</button>

            {/* 今後、在庫リストがここに表示される */}
            <p className="title" style={{ marginTop: '2rem' }}>
                ここに在庫リストが表示されます（現在はスタブ）
            </p>
        </div>
    );
}

export default Zaiko;
