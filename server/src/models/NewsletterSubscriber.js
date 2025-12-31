const mongoose = require('mongoose');

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, required: true, default: 'public_signup' },
    status: { type: String, required: true, default: 'active', enum: ['active', 'unsubscribed'] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);
