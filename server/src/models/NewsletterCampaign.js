const mongoose = require('mongoose');

const NewsletterCampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    htmlContent: { type: String, required: true },
    textContent: { type: String, required: true },
    status: { type: String, required: true, default: 'draft', enum: ['draft', 'sent', 'sending'] },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    error: { type: String },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsletterCampaign', NewsletterCampaignSchema);
