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

// ユーザー登録API
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

        // ユーザー挿入
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        // result.insertId に新規ユーザーのIDが入っている
        const user_id = result.insertId;

        res.status(201).json({
            message: '登録成功',
            user_id: user_id
        });
    } catch (err) {
        console.error('登録エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});


//  ログインAPI
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

        // user_id もトップレベルで返す
        res.status(200).json({
            message: 'ログイン成功',
            user_id: user.id,
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


// 商品マスター登録
app.post('/api/items', async (req, res) => {
    const { user_id, name, quantity } = req.body;

    if (!user_id || !name) {
        return res.status(400).json({ message: '必要な情報が不足しています' });
    }

    try {
        await db.query('INSERT INTO items (user_id, name, quantity) VALUES (?, ?, ?)', [
            user_id, name, quantity || 0,
        ]);
        res.status(201).json({ message: '商品登録に成功しました' });
    } catch (err) {
        console.error('商品登録エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 在庫一覧取得API
app.get('/api/items', async (req, res) => {
    const user_id = req.query.user_id;

    if (!user_id) {
        return res.status(400).json({ message: 'user_idが必要です' });
    }

    try {
        const [items] = await db.query(
            'SELECT id, name, quantity FROM items WHERE user_id = ?',
            [user_id]
        );
        res.status(200).json({ items });
    } catch (err) {
        console.error('在庫一覧取得エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 入庫API
app.post('/api/items/in', async (req, res) => {
    const { user_id, item_id, quantity } = req.body;

    if (!user_id || !item_id || !quantity) {
        return res.status(400).json({ message: '必要な情報が不足しています' });
    }

    try {
        // 数量を加算
        await db.query(
            'UPDATE items SET quantity = quantity + ? WHERE id = ? AND user_id = ?',
            [quantity, item_id, user_id]
        );

        // ログを記録
        await db.query(
            'INSERT INTO logs (user_id, item_id, action, quantity) VALUES (?, ?, ?, ?)',
            [user_id, item_id, 'in', quantity]
        );

        res.status(200).json({ message: '入庫処理が完了しました' });
    } catch (err) {
        console.error('入庫エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 出庫API
app.post('/api/items/out', async (req, res) => {
    const { user_id, item_id, quantity } = req.body;

    if (!user_id || !item_id || !quantity) {
        return res.status(400).json({ message: '必要な情報が不足しています' });
    }

    try {
        // 現在の在庫数を取得
        const [rows] = await db.query(
            'SELECT quantity FROM items WHERE id = ? AND user_id = ?',
            [item_id, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '該当する商品が見つかりません' });
        }

        const currentQuantity = rows[0].quantity;

        if (currentQuantity < quantity) {
            return res.status(400).json({ message: '在庫数以上の出庫は出来ません' });
        }

        // 数量を減算
        await db.query(
            'UPDATE items SET quantity = quantity - ? WHERE id = ? AND user_id = ?',
            [quantity, item_id, user_id]
        );

        // ログを記録
        await db.query(
            'INSERT INTO logs (user_id, item_id, action, quantity) VALUES (?, ?, ?, ?)',
            [user_id, item_id, 'out', quantity]
        );

        res.status(200).json({ message: '出庫処理が完了しました' });
    } catch (err) {
        console.error('出庫エラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// ジャーナルAPI
// userIdの取得（JWT導入前の暫定）
function getUserId(req) {
    return req.user?.id || req.session?.userId || Number(req.query.user_id);
}

app.get('/api/journal', async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { from, to, action, item, page = 1, pageSize = 20 } = req.query;
        const limit = Math.max(1, Math.min(200, Number(pageSize)));
        const offset = (Math.max(1, Number(page)) - 1) * limit;

        const where = ['l.user_id = ?'];
        const params = [userId];

        if (action === 'in' || action === 'out') { where.push('l.action = ?'); params.push(action); }
        if (from) { where.push('l.created_at >= ?'); params.push(`${from} 00:00:00`); }
        if (to)   { where.push('l.created_at <= ?'); params.push(`${to} 23:59:59`); }
        if (item && item.trim()) { where.push('i.name LIKE ?'); params.push(`%${item.trim()}%`); }

        const whereSql = `WHERE ${where.join(' AND ')}`;

        const [cntRows] = await db.query(
            `SELECT COUNT(*) AS cnt
       FROM logs l
       JOIN items i ON i.id = l.item_id
       ${whereSql}`,
            params
        );
        const total = cntRows[0]?.cnt ?? 0;
        // 本番で時間がずれるようなら　'+00:00', '+09:00'　に変更
        const [rows] = await db.query(
            `SELECT 
         l.id, l.item_id, i.name AS item_name, l.action, l.quantity,
         DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') AS date
       FROM logs l
       JOIN items i ON i.id = l.item_id
       ${whereSql}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({ rows, page: Number(page), pageSize: limit, total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
