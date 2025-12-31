const axios = require('axios');

async function sendEmail(args) {
  const apiKey = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

  console.log('[email] sendEmail: apiKey?', !!apiKey, 'from?', from, 'to?', args.to);
  if (!apiKey || !from) return { ok: false, skipped: true };

  const toList = Array.isArray(args.to) ? args.to : [args.to];
  const to = toList.map((x) => String(x || '').trim()).filter(Boolean).join(',');
  if (!to) return { ok: false, skipped: true };

  console.log('[email] Sending via Brevo API to', to);
  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: from },
      to: to.split(',').map(email => ({ email })),
      subject: args.subject,
      htmlContent: args.html,
      textContent: args.text
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      timeout: 15000
    });
    console.log('[email] Sent successfully via Brevo API', response.status);
    return { ok: true };
  } catch (e) {
    console.error('[email] Brevo API error', e.response?.status, e.response?.data || e.message);
    throw e;
  }
}

module.exports = {
  sendEmail
};
