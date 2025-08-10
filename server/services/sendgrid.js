// server/services/sendgrid.js
const sg = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
    console.warn('[warn] SENDGRID_API_KEY is not set');
} else {
    sg.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = process.env.SENDGRID_FROM || process.env.MAIL_FROM; // ←どちらでも拾う

async function sendMail({ to, subject, html, text }) {
    if (!FROM) throw new Error('SENDGRID_FROM (or MAIL_FROM) is not set in .env');

    const msg = {
        to,
        from: FROM,                // SendGridでVerify済みのアドレス
        subject,
        text: text || undefined,   // 任意
        html,
    };
    const [res] = await sg.send(msg); // 正常なら 202
    return res;
}

module.exports = { sendMail };
