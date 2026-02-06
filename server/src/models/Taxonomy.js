const mongoose = require('mongoose');

const taxonomySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['location', 'resourceType', 'audience'],
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique values within each taxonomy type
taxonomySchema.index({ type: 1, value: 1 }, { unique: true });

// Static method to get active taxonomy items by type
taxonomySchema.statics.getActiveByType = function(type) {
  return this.find({ type, isActive: true }).sort({ sortOrder: 1, label: 1 });
};

// Static method to get all taxonomy items for admin
taxonomySchema.statics.getAllByType = function(type) {
  return this.find({ type }).sort({ sortOrder: 1, label: 1 });
};

module.exports = mongoose.model('Taxonomy', taxonomySchema);
