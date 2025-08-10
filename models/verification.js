const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  passportDocument: {
    type: String, // URL to uploaded document
    required: true
  },
  personalPicture: {
    type: String, // URL to uploaded picture
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
verificationSchema.index({ user: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Verification', verificationSchema); 