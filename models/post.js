const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    name: String,
    avatar: String,
    userId: String
  },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
  url: String,
  type: String,
  uploadedAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  user: {
    name: String,
    avatar: String,
    userId: String
  },
  content: String,
  media: [mediaSchema],
  likes: [String], // userIds
  comments: [commentSchema],
  savedBy: [String], // userIds
  shares: [String], // userIds
  views: [String], // userIds
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
