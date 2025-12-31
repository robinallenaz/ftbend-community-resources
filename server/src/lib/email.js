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
    auth: { user, pass },
    // Explicit TLS for port 587; increase timeout for Render
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });

  return cached;
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || '';
}

async function sendEmail(args) {
  const transport = getTransport();
  const from = getFromAddress();

  console.log('[email] sendEmail: transport?', !!transport, 'from?', from, 'to?', args.to);
  if (!transport || !from) return { ok: false, skipped: true };

  const toList = Array.isArray(args.to) ? args.to : [args.to];
  const to = toList.map((x) => String(x || '').trim()).filter(Boolean).join(',');
  if (!to) return { ok: false, skipped: true };

  console.log('[email] Sending to', to);
  await transport.sendMail({
    from,
    to,
    subject: args.subject,
    text: args.text,
    html: args.html
  });

  console.log('[email] Sent successfully');
  return { ok: true };
}

module.exports = {
  sendEmail
};
