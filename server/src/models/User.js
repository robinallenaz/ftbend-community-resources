const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'editor'], default: 'editor' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
