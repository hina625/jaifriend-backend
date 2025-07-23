const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, match: /.+@.+\..+/ },
  password: { type: String, required: true },
  name: { type: String, default: null },
  fullName: { type: String, default: null },
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: null },
  coverPhoto: { type: String, default: null },
  bio: { type: String, default: null },
  location: { type: String, default: null },
  workplace: { type: String, default: null },
  country: { type: String, default: null },
  address: { type: String, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
  isSetupDone: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // posts the user has saved
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users this user follows
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users following this user
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // posts by this user
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], // groups the user has joined
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // posts the user has liked
}, {
  timestamps: true
});

// Custom validation: at least one of name or fullName must be present
userSchema.pre('validate', function(next) {
  if (!this.name && !this.fullName) {
    this.invalidate('name', 'Either name or fullName is required');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
