// server/server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// DB接続（Promise対応のPoolで初期化）
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zaiko',
}).promise();

// 動作確認
app.get('/', (req, res) => {
    res.send('APIサーバー稼働中');
});

// 🔐 ユーザー登録API
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 既存ユーザー確認
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: '既に登録されています' });
        }

        // パスワードのハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);

        // password_hash カラムに保存
        await db.query(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: '登録成功' });
    } catch (err) {
        console.error('登録エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 🔑 ログインAPI
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'メールアドレスが存在しません' });
        }

        const user = rows[0];

        // password_hash と照合
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: 'パスワードが一致しません' });
        }

        res.status(200).json({
            message: 'ログイン成功',
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (err) {
        console.error('ログインエラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
