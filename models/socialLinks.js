const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  facebook: {
    type: String,
    trim: true,
    default: ''
  },
  twitter: {
    type: String,
    trim: true,
    default: ''
  },
  vkontakte: {
    type: String,
    trim: true,
    default: ''
  },
  linkedin: {
    type: String,
    trim: true,
    default: ''
  },
  instagram: {
    type: String,
    trim: true,
    default: ''
  },
  youtube: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Create index for faster queries
socialLinksSchema.index({ user: 1 });

module.exports = mongoose.model('SocialLinks', socialLinksSchema); 