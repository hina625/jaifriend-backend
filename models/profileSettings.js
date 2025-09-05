const mongoose = require('mongoose');

const profileSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  aboutMe: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  relationship: {
    type: String,
    enum: [
      'None',
      'Single',
      'In a relationship',
      'Engaged',
      'Married',
      'It\'s complicated',
      'In an open relationship',
      'Widowed',
      'Separated',
      'Divorced'
    ],
    default: 'None'
  },
  school: {
    type: String,
    default: ''
  },
  schoolCompleted: {
    type: Boolean,
    default: false
  },
  workingAt: {
    type: String,
    default: ''
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
profileSettingsSchema.index({ userId: 1 });
profileSettingsSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('ProfileSettings', profileSettingsSchema); 