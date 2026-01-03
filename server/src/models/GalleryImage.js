const mongoose = require('mongoose');

const GalleryImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, default: '' },
    order: { type: Number, required: true },
    status: { type: String, required: true, enum: ['active', 'archived'], default: 'active' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

GalleryImageSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('GalleryImage', GalleryImageSchema);
