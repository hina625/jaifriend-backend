const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  user: {
    name: String,
    username: String,
    avatar: String,
    verified: { type: Boolean, default: false },
    isPro: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  title: String,
  description: String,
  hashtag: String,
  videoUrl: { type: String, required: true },
  videoThumbnail: String,
  isYoutube: { type: Boolean, default: false },
  isSponsored: { type: Boolean, default: false },
  duration: Number, // in seconds
  category: String,
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema); 