const NotificationSettings = require('../models/NotificationSettings');

function firstOriginFromAllowlist(raw) {
  const list = String(raw || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return list[0] || '';
}

function getDefaultPublicSiteUrl() {
  const envUrl = process.env.PUBLIC_SITE_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, '');

  const origin = firstOriginFromAllowlist(process.env.CLIENT_ORIGIN);
  if (origin) return origin.replace(/\/+$/, '');

  return 'https://ftbend-community-resources.netlify.app';
}

async function getOrCreateNotificationSettings() {
  const existing = await NotificationSettings.findOne({ key: 'global' });
  if (existing) {
    if (!existing.publicSiteUrl) {
      existing.publicSiteUrl = getDefaultPublicSiteUrl();
      await existing.save();
    }
    return existing;
  }

  return NotificationSettings.create({
    key: 'global',
    submissionEmailEnabled: false,
    submissionEmailRecipients: [],
    publicSiteUrl: getDefaultPublicSiteUrl()
  });
}

module.exports = {
  getOrCreateNotificationSettings,
  getDefaultPublicSiteUrl
};
