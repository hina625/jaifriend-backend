const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 500
  },
  media: {
    type: String, // URL to media file
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  thumbnail: {
    type: String, // URL to thumbnail (for videos)
    default: null
  },
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      trim: true,
      maxlength: 200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Set expiration to 24 hours from creation
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying of active stories
storySchema.index({ isActive: 1, expiresAt: 1 });
storySchema.index({ userId: 1, createdAt: -1 });

// Method to check if story is expired
storySchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to mark story as inactive
storySchema.methods.markInactive = function() {
  this.isActive = false;
  return this.save();
};

// Static method to get active stories
storySchema.statics.getActiveStories = function() {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId', 'username avatar fullName');
};

// Static method to get stories by user
storySchema.statics.getStoriesByUser = function(userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get all active stories for feed
storySchema.statics.getFeedStories = function(userIds = []) {
  const query = {
    isActive: true,
    expiresAt: { $gt: new Date() }
  };
  
  if (userIds.length > 0) {
    query.userId = { $in: userIds };
  }
  
  return this.find(query)
    .populate('userId', 'username avatar fullName')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Story', storySchema);
