const nodemailer = require('nodemailer');

let cached = null;

function getTransport() {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portRaw || !user || !pass) return null;

  const port = Number(portRaw);
  const secure = port === 465;

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return cached;
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || '';
}

async function sendEmail(args) {
  const transport = getTransport();
  const from = getFromAddress();

  if (!transport || !from) return { ok: false, skipped: true };

  const toList = Array.isArray(args.to) ? args.to : [args.to];
  const to = toList.map((x) => String(x || '').trim()).filter(Boolean).join(',');
  if (!to) return { ok: false, skipped: true };

  await transport.sendMail({
    from,
    to,
    subject: args.subject,
    text: args.text,
    html: args.html
  });

  return { ok: true };
}

module.exports = {
  sendEmail
};
