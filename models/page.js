const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  url: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Cars and Vehicles',
      'Education',
      'Technology',
      'Business',
      'Entertainment',
      'Sports',
      'Food & Drink',
      'Travel',
      'Other'
    ]
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  creatorName: {
    type: String,
    required: true
  },
  creatorAvatar: {
    type: String,
    default: '/avatars/1.png.png'
  },
  profileImage: {
    type: String,
    default: '/avatars/1.png.png'
  },
  coverImage: {
    type: String,
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
pageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Page', pageSchema); 