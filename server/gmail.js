// gmail.js
import { google } from 'googleapis';
import nodemailer from 'nodemailer'; // MIME生成に使うと楽

export async function sendGmail({ to, subject, html }) {
    // .env に保存したクライアント情報と refresh_token を使用
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // 一度トークン取得時に使う
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // MIME メールの生成
    const transporter = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
    const { message } = await transporter.sendMail({
        from: process.env.MAIL_FROM, // 例: '在庫くん <noreply@zaikokun.com>'
        to,
        subject,
        html,
    });

    // Gmail API が受け付ける base64url へ
    const encodedMessage = message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // 送信
    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
    });

    return res.data;
}
