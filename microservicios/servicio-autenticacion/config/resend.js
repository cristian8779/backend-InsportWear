require('dotenv').config(); // 👈 asegurate de que esto vaya al principio

const { Resend } = require('resend');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY no está definido. Verificá tu archivo .env');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = resend;
