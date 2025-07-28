const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitationCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Invitation expires in 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
invitationSchema.index({ userId: 1, status: 1 });
invitationSchema.index({ invitationCode: 1 });
invitationSchema.index({ expiresAt: 1 });

// Generate unique invitation code
invitationSchema.pre('save', async function(next) {
  if (this.isNew && !this.invitationCode) {
    this.invitationCode = await generateUniqueCode();
  }
  next();
});

// Function to generate unique invitation code
async function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const existing = await mongoose.model('Invitation').findOne({ invitationCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

module.exports = mongoose.model('Invitation', invitationSchema); 