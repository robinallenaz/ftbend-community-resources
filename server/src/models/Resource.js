const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    locations: [{ type: String, required: true }],
    types: [{ type: String, required: true }],
    audiences: [{ type: String, required: true }],
    tags: [{ type: String, required: true }],
    status: { type: String, required: true, enum: ['active', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

ResourceSchema.index({ name: 'text', description: 'text', tags: 'text', locations: 'text', types: 'text', audiences: 'text' });

module.exports = mongoose.model('Resource', ResourceSchema);
