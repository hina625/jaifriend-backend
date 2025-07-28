const mongoose = require('mongoose');

const passwordChangeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  reason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
passwordChangeSchema.index({ userId: 1, changedAt: -1 });
passwordChangeSchema.index({ status: 1, changedAt: -1 });

module.exports = mongoose.model('PasswordChange', passwordChangeSchema); 