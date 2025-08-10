// server/server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
const crypto = require('crypto');
const { sendGmail } = require('./services/gmail');
// ミドルウェア
//app.use(cors());
app.use(cors({ origin: 'http://localhost:5173' }));
const jwt = require('jsonwebtoken');
app.use(express.json());

// DB接続（Promise対応のPoolで初期化）
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zaiko',
}).promise();

// jWT関連
function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role ?? 0 },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );
}

function authRequired(req, res, next) {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'トークンが必要です' });
        }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { sub, email, role, iat, exp }
        next();
        } catch (e) {
            return res.status(401).json({ message: 'トークンが無効または期限切れです' });
        }
    }

// パスワードリセット要求
app.post('/api/password/reset-request', async (req, res) => {
    const { email } = req.body;
    // 同じレスポンスで情報漏えいを防ぐ（存在しないメールも同じメッセージ）
    const SAFE_MSG = { ok: true, message: 'もし該当アカウントが存在すれば、リセットメールを送信しました。' };

    try {
        if (!email || !email.includes('@')) return res.status(200).json(SAFE_MSG);

        const [users] = await db.query('SELECT id, email FROM users WHERE email=? LIMIT 1', [email]);
        if (users.length === 0) return res.status(200).json(SAFE_MSG);

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex'); // 64桁
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分

        await db.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)',
            [user.id, token, expiresAt]
        );

        const resetUrl = `https://zaikokun.com/reset?token=${token}`;
        const html = `
      <p>パスワード再設定のご案内</p>
      <p>以下のリンクから30分以内に新しいパスワードを設定してください。</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>もしこのメールに心当たりがない場合は破棄してください。</p>
    `;

        await sendGmail({ to: user.email, subject: '【在庫くん】パスワード再設定', html });

        return res.status(200).json(SAFE_MSG);
    } catch (e) {
        console.error('reset-request error:', e);
        return res.status(200).json(SAFE_MSG); // 常に同じ応答
    }
});


// パスワードの再設定
app.post('/api/password/reset', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: '不正なリクエストです' });
    }

    try {
        // トークン有効性チェック（未使用・期限内）
        const [rows] = await db.query(
            `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
         FROM password_resets pr
        WHERE pr.token = ?
        LIMIT 1`,
            [token]
        );

        const rec = rows[0];
        const now = new Date();

        if (!rec || rec.used_at || new Date(rec.expires_at) < now) {
            return res.status(400).json({ message: 'トークンが無効または期限切れです' });
        }

        // パスワード更新
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, rec.user_id]);

        // トークンを使用済みに
        await db.query('UPDATE password_resets SET used_at=NOW() WHERE id=?', [rec.id]);

        return res.json({ ok: true, message: 'パスワードを更新しました' });
    } catch (e) {
        console.error('reset error:', e);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});


// ============================


// 動作確認
app.get('/', (req, res) => {
    res.send('APIサーバー稼働中');
});

// ユーザー登録API
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: '既に登録されています' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        const user_id = result.insertId;
        const token = signAccessToken({ id: user_id, email }); // ← const を付ける

        // レスポンスは1回だけ
        return res.status(201).json({ message: '登録成功', user_id, token });
    } catch (err) {
        console.error('登録エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
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
 //       res.status(200).json({
 //           message: 'ログイン成功',
 //           user_id: user.id,
 //           user: {
 //               id: user.id,
 //               email: user.email
 //           }
 //       });
        // JWT を返す
        const token = signAccessToken(user);
        res.status(200).json({
                message: 'ログイン成功',
            token,
            user: { id: user.id, email: user.email }
        });
      } catch (err) {
        console.error('ログインエラー:', err);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 商品マスター登録（JWT 必須）
    app.post('/api/items', authRequired, async (req, res) => {
        const { name, quantity } = req.body;
        const user_id = req.user.sub;
        if (!name || !name.trim()) return res.status(400).json({ message: '商品名が必要です' });

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
app.get('/api/items', authRequired, async (req, res) => {
    const user_id = req.user.sub;

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
app.post('/api/items/in', authRequired, async (req, res) => {
    const { item_id, quantity } = req.body;
    const user_id = req.user.sub;
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: '数量は正の整数で指定してください' });
    }
    if (!item_id || !quantity) {
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
app.post('/api/items/out', authRequired, async (req, res) => {
    const { item_id, quantity } = req.body;
    const user_id = req.user.sub;
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: '数量は正の整数で指定してください' });
    }
    if (!item_id || !quantity){
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
app.get('/api/journal', authRequired, async (req, res) => {
    try {
        const userId = req.user.sub;

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
