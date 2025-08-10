// server/services/gmail.js (CommonJS)
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

async function sendGmail({ to, subject, html }) {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // MIME を楽に作るために nodemailer を利用（実送信はGmail API）
    const transporter = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
    const { message } = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });

    // base64url へ
    const raw = message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

module.exports = { sendGmail };
