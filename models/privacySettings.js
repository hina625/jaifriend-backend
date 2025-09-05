const mongoose = require('mongoose');

const privacySettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Online', 'Offline', 'Away', 'Busy'],
    default: 'Online'
  },
  whoCanFollowMe: {
    type: String,
    enum: ['Everyone', 'Friends only', 'No one'],
    default: 'Everyone'
  },
  whoCanMessageMe: {
    type: String,
    enum: ['Everyone', 'Friends only', 'People I Follow', 'No one'],
    default: 'Everyone'
  },
  whoCanSeeMyFriends: {
    type: String,
    enum: ['Everyone', 'Friends only', 'Only me'],
    default: 'Everyone'
  },
  whoCanPostOnMyTimeline: {
    type: String,
    enum: ['Everyone', 'Friends only', 'People I Follow', 'Only me'],
    default: 'People I Follow'
  },
  whoCanSeeMyBirthday: {
    type: String,
    enum: ['Everyone', 'Friends only', 'Only me'],
    default: 'Everyone'
  },
  confirmRequestWhenSomeoneFollowsYou: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  showMyActivities: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  shareMyLocationWithPublic: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  allowSearchEnginesToIndex: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
privacySettingsSchema.index({ userId: 1 });
privacySettingsSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('PrivacySettings', privacySettingsSchema); 