const mongoose = require('mongoose');

const userImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: null
  },
  cover: {
    type: String,
    default: null
  },
  avatarFileName: {
    type: String,
    default: null
  },
  coverFileName: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserImage', userImageSchema); 