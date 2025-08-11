const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, match: /.+@.+\..+/ },
  password: { type: String, required: true },
  name: { type: String, default: null },
  fullName: { type: String, default: null },
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: '/avatars/1.png.png' },
  coverPhoto: { type: String, default: null },
  bio: { type: String, default: null, maxlength: 500 },
  status: { type: String, default: null, maxlength: 100 },
  location: { type: String, default: null },
  website: { type: String, default: null },
  workplace: { type: String, default: null },
  country: { type: String, default: null },
  address: { type: String, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], default: 'Prefer not to say' },
  dateOfBirth: { type: Date, default: null },
  phone: { type: String, default: null },
  isSetupDone: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  notifications: [{
    type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'message'] },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }

  }],
  notificationSettings: {
    someonelikedMyPosts: { type: Boolean, default: true },
    someoneCommentedOnMyPosts: { type: Boolean, default: true },
    someoneSharedOnMyPosts: { type: Boolean, default: true },
    someoneFollowedMe: { type: Boolean, default: true },
    someoneLikedMyPages: { type: Boolean, default: true },
    someoneVisitedMyProfile: { type: Boolean, default: true },
    someoneMentionedMe: { type: Boolean, default: true },
    someoneJoinedMyGroups: { type: Boolean, default: true },
    someoneAcceptedMyFriendRequest: { type: Boolean, default: true },
    someonePostedOnMyTimeline: { type: Boolean, default: true }
  },

}, {
  timestamps: true
});

// Custom validation: at least one of name or fullName must be present
userSchema.pre('validate', function(next) {
  if (!this.name && !this.fullName) {
    // Set name to username if neither name nor fullName is provided
    this.name = this.username;
  }
  next();
});

// Update lastSeen when user goes offline
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = false;
  return this.save();
};

// Mark user as online
userSchema.methods.markOnline = function() {
  this.isOnline = true;
  this.lastSeen = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
