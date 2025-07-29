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

// DB接続
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zaiko',
});

db.connect((err) => {
    if (err) {
        console.error('DB接続失敗:', err);
    } else {
        console.log('MySQL接続成功');
    }
});

// 動作確認ルート
app.get('/', (req, res) => {
    res.send('APIサーバー稼働中');
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
