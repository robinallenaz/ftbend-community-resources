const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    submissionEmailEnabled: { type: Boolean, required: true, default: false },
    submissionEmailRecipients: { type: [String], required: true, default: [] },
    publicSiteUrl: { type: String, required: false, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationSettings', NotificationSettingsSchema);
