import { useNavigate } from 'react-router-dom';


import '../styles/Main.css';

function Legal() {
    const navigate = useNavigate();

    const goToTop = () => {
        navigate('/');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 className="title">利用規約</h2>
            <h3 className="title">当サイト・在庫くんの利用規約です</h3>
            <ul>
                <li className="title">当サイトの利用規約は当サイトのアカウントを取得し利用を開始した時点で効力を発揮します</li>
                <li className="title">個人情報について：当サイトでは利用者の個人情報（アクセスログ、IP、メールアドレスを厳重に管理し、流出する事が無いよう務めます</li>
                <li className="title">個人情報について補足：当サイトは以下の場合を除いて個人情報の開示は行いません。<br />
                1.裁判所からの正規の手続きを経た開示請求が行われた場合<br />2.警察その他日本国内の司法機関からの正規の手続きを経た開示請求が行われた場合<br />
                3.当サイトが利用者による悪意のある攻撃、または運営妨害がされ、その情報を警察その他司法機関に届け出る場合</li>
                <li className="title">当サイトは以下の目的で利用する事を禁じます。<br />1.違法な情報・物品を取り扱う目的での利用<br />
                2.その他公序良俗にそぐわない目的での利用<br />3.反社会勢力に属する者の利用
                </li>
                <li className="title">責任の所在1:当サイトを利用して発生した物理的・精神的・金銭上のトラブルについて当サイトは一切責任を負いません。</li>
                <li className="title">責任の所在2:当サイトは事故・災害・運営者の疾病または負傷などの理由で運営継続が困難になった場合サービスを事前に予告の上停止する事がございます</li>
            </ul>
            <h3 className="title">利用料金</h3>
            <p className="title">当サイトは非営利での利用のみ利用できます。<br />法人・個人事業主・その他営利目的でのご利用の際は商用利用規約(年10,000円でご契約頂きます。<br />
                契約を希望される方は<i>hasidume.factory@gmail.com</i>までご連絡下さい)</p>
            <h3 className="title">特定商取引法の表示</h3>
            <p className="title">運営者：橋詰史典<br />メールアドレス：hasidume.factory@gmail.com
            <br />その他の省略された情報の開示を希望される方は上記メールアドレスにお問い合わせされる方の本名・住所・利用目的を添えてお問い合わせください。
            </p>
            <div style={{margin:10 }}>
                <button onClick={goToTop}>トップページへ</button>
            </div>

        </div>
    );
}

export default Legal;
