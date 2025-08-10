const mongoose = require('mongoose');

const dataExportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedDataTypes: [{
    type: String,
    enum: ['information', 'posts', 'groups', 'pages', 'followers', 'following'],
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: function() {
      // File expires in 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
dataExportSchema.index({ userId: 1, createdAt: -1 });
dataExportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DataExport', dataExportSchema); 