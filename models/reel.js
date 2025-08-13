const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  user: {
    name: String,
    username: String,
    avatar: String,
    verified: { type: Boolean, default: false },
    isPro: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  title: { type: String, required: true },
  description: String,
  hashtags: [String],
  videoUrl: { type: String, required: true },
  thumbnailUrl: String,
  duration: { type: Number, required: true }, // in seconds
  aspectRatio: { type: String, default: '9:16' }, // reels are typically vertical
  music: {
    title: String,
    artist: String,
    url: String,
    startTime: Number // when music starts in the reel
  },
  effects: [{
    name: String,
    type: String, // filter, transition, text, etc.
    settings: mongoose.Schema.Types.Mixed
  }],
  privacy: {
    type: String,
    enum: ['everyone', 'friends', 'private'],
    default: 'everyone'
  },
  category: {
    type: String,
    default: 'general'
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: {
        name: String,
        avatar: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isTrending: { type: Boolean, default: false },
  trendingScore: { type: Number, default: 0 },
  isSponsored: { type: Boolean, default: false },
  sponsorInfo: {
    name: String,
    logo: String,
    website: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
reelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
reelSchema.index({ createdAt: -1 });
reelSchema.index({ trendingScore: -1 });
reelSchema.index({ 'user.userId': 1 });
reelSchema.index({ category: 1 });
reelSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Reel', reelSchema);
