const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    schedule: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    locationHint: { type: String, required: true, trim: true, maxlength: 200 },
    instagramPost: { type: String, trim: true, maxlength: 500 },
    facebookEvent: { type: String, trim: true, maxlength: 500 },
    status: { type: String, required: true, enum: ['active', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

EventSchema.index({ name: 'text', schedule: 'text', locationHint: 'text' });

module.exports = mongoose.model('Event', EventSchema);
