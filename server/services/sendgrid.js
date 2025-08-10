// server/services/sendgrid.js
const sg = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
    console.warn('[warn] SENDGRID_API_KEY is not set');
} else {
    sg.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendMail({ to, subject, html }) {
    if (!process.env.MAIL_FROM) {
        throw new Error('MAIL_FROM is not set in .env');
    }
    const msg = {
        to,
        from: process.env.MAIL_FROM, // 送信者はSendGrid側で検証済みであること
        subject,
        html,
    };
    const [res] = await sg.send(msg); // 成功時 202 Accepted
    return res;
}

module.exports = { sendMail };
