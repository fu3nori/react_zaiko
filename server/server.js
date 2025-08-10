// server/server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('./services/sendgrid'); // ★ SendGrid送信

// ミドルウェア
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// DB接続（PromisePool）
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zaiko',
}).promise();

// JWT関連
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
    } catch {
        return res.status(401).json({ message: 'トークンが無効または期限切れです' });
    }
}

// 動作確認
app.get('/', (_req, res) => {
    res.send('APIサーバー稼働中');
});

// ユーザー登録
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE email=?', [email]);
        if (rows.length) return res.status(400).json({ message: '既に登録されています' });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hash]
        );
        const user_id = result.insertId;
        const token = signAccessToken({ id: user_id, email });
        return res.status(201).json({ message: '登録成功', user_id, token });
    } catch (err) {
        console.error('登録エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// ログイン
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email=? LIMIT 1', [email]);
        if (!rows.length) return res.status(401).json({ message: 'メールアドレスが存在しません' });
        const user = rows[0];

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ message: 'パスワードが一致しません' });

        const token = signAccessToken(user);
        return res.json({ message: 'ログイン成功', token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error('ログインエラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 商品マスター登録
app.post('/api/items', authRequired, async (req, res) => {
    const { name, quantity } = req.body;
    const user_id = req.user.sub;
    if (!name || !name.trim()) return res.status(400).json({ message: '商品名が必要です' });
    try {
        await db.query('INSERT INTO items (user_id, name, quantity) VALUES (?,?,?)', [
            user_id, name, quantity || 0,
        ]);
        return res.status(201).json({ message: '商品登録に成功しました' });
    } catch (err) {
        console.error('商品登録エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 在庫一覧
app.get('/api/items', authRequired, async (req, res) => {
    const user_id = req.user.sub;
    try {
        const [items] = await db.query('SELECT id, name, quantity FROM items WHERE user_id=?', [user_id]);
        return res.json({ items });
    } catch (err) {
        console.error('在庫一覧取得エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 入庫
app.post('/api/items/in', authRequired, async (req, res) => {
    const { item_id, quantity } = req.body;
    const user_id = req.user.sub;
    if (!item_id) return res.status(400).json({ message: '商品IDが必要です' });
    if (!Number.isInteger(quantity) || quantity <= 0)
        return res.status(400).json({ message: '数量は正の整数で指定してください' });
    try {
        await db.query('UPDATE items SET quantity = quantity + ? WHERE id=? AND user_id=?', [
            quantity, item_id, user_id,
        ]);
        await db.query('INSERT INTO logs (user_id, item_id, action, quantity) VALUES (?,?,?,?)', [
            user_id, item_id, 'in', quantity,
        ]);
        return res.json({ message: '入庫処理が完了しました' });
    } catch (err) {
        console.error('入庫エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 出庫
app.post('/api/items/out', authRequired, async (req, res) => {
    const { item_id, quantity } = req.body;
    const user_id = req.user.sub;
    if (!item_id) return res.status(400).json({ message: '商品IDが必要です' });
    if (!Number.isInteger(quantity) || quantity <= 0)
        return res.status(400).json({ message: '数量は正の整数で指定してください' });

    try {
        const [rows] = await db.query('SELECT quantity FROM items WHERE id=? AND user_id=?', [
            item_id, user_id,
        ]);
        if (!rows.length) return res.status(404).json({ message: '該当する商品が見つかりません' });
        if (rows[0].quantity < quantity)
            return res.status(400).json({ message: '在庫数以上の出庫は出来ません' });

        await db.query('UPDATE items SET quantity = quantity - ? WHERE id=? AND user_id=?', [
            quantity, item_id, user_id,
        ]);
        await db.query('INSERT INTO logs (user_id, item_id, action, quantity) VALUES (?,?,?,?)', [
            user_id, item_id, 'out', quantity,
        ]);
        return res.json({ message: '出庫処理が完了しました' });
    } catch (err) {
        console.error('出庫エラー:', err);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// ジャーナル
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
       ${whereSql}`, params
        );
        const total = cntRows[0]?.cnt ?? 0;

        const [rows] = await db.query(
            `SELECT 
         l.id, l.item_id, i.name AS item_name, l.action, l.quantity,
         DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') AS date
       FROM logs l
       JOIN items i ON i.id = l.item_id
       ${whereSql}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`, [...params, limit, offset]
        );
        return res.json({ rows, page: Number(page), pageSize: limit, total });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// パスワードリセット要求（SendGridでメール送信）
app.post('/api/password/reset-request', async (req, res) => {
    const { email } = req.body;
    const SAFE_MSG = { ok: true, message: 'もし該当アカウントが存在すれば、リセットメールを送信しました。' };

    try {
        if (!email || !email.includes('@')) return res.status(200).json(SAFE_MSG);

        const [users] = await db.query('SELECT id, email FROM users WHERE email=? LIMIT 1', [email]);
        if (!users.length) return res.status(200).json(SAFE_MSG);

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex'); // 64桁
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await db.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)',
            [user.id, token, expiresAt]
        );

        const resetUrl = `https://zaikokun.com/reset?token=${token}`;
        const html = `
      <p>パスワード再設定のご案内</p>
      <p>以下のリンクから30分以内に新しいパスワードを設定してください。</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>このメールに心当たりがない場合は破棄してください。</p>
    `;
        await sendMail({ to: user.email, subject: '【在庫くん】パスワード再設定', html });

        return res.status(200).json(SAFE_MSG);
    } catch (e) {
        console.error('reset-request error:', e);
        return res.status(200).json(SAFE_MSG); // 情報漏えいを避ける
    }
});

// パスワード再設定
app.post('/api/password/reset', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: '不正なリクエストです' });
    }
    try {
        const [rows] = await db.query(
            `SELECT id, user_id, expires_at, used_at
         FROM password_resets
        WHERE token=? LIMIT 1`, [token]
        );
        const rec = rows[0];
        const now = new Date();
        if (!rec || rec.used_at || new Date(rec.expires_at) < now) {
            return res.status(400).json({ message: 'トークンが無効または期限切れです' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, rec.user_id]);
        await db.query('UPDATE password_resets SET used_at=NOW() WHERE id=?', [rec.id]);

        return res.json({ ok: true, message: 'パスワードを更新しました' });
    } catch (e) {
        console.error('reset error:', e);
        return res.status(500).json({ message: 'サーバーエラー' });
    }
});

// 起動
app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
