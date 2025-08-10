const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    avatar: { type: String, default: '/avatars/1.png.png' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  content: { type: String, required: true, maxlength: 5000 },
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'audio'], default: 'image' },
      thumbnail: { type: String },
      duration: { type: Number }, // for videos/audio
      size: { type: Number }, // file size in bytes
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  location: {
    name: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], 
      default: 'like' 
    },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [
    {
      user: {
        name: { type: String, required: true },
        avatar: { type: String, default: '/avatars/1.png.png' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      },
      text: { type: String, required: true, maxlength: 1000 },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      replies: [{
        user: {
          name: { type: String, required: true },
          avatar: { type: String, default: '/avatars/1.png.png' },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
        },
        text: { type: String, required: true, maxlength: 1000 },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now }
    }
  ],
  isShared: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  originalAlbum: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  shareMessage: { type: String, maxlength: 500 },
  sharedFrom: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userAvatar: { type: String },
    albumName: { type: String },
    albumMedia: [{ type: Object }]
  },
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],
  privacy: { 
    type: String, 
    enum: ['public', 'friends', 'private'], 
    default: 'public' 
  },
  isSponsored: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  language: { type: String, default: 'en' },
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' }
}, {
  timestamps: true
});

// Indexes for better performance
postSchema.index({ 'user.userId': 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ mentions: 1 });
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ content: 'text', hashtags: 'text' });

// Pre-save middleware to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    this.hashtags = [...new Set(this.content.match(hashtagRegex)?.map(tag => tag.slice(1)) || [])];
    
    // Extract mentions (assuming @username format)
    const mentionRegex = /@(\w+)/g;
    const mentions = this.content.match(mentionRegex)?.map(mention => mention.slice(1)) || [];
    
    // Note: In a real app, you'd look up user IDs by username here
    // this.mentions = await User.find({ username: { $in: mentions } }).select('_id');
  }
  next();
});

// Virtual for reaction counts
postSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Virtual for total engagement
postSchema.virtual('totalEngagement').get(function() {
  return this.likes.length + this.comments.length + this.shares.length + this.views.length;
});

// Method to add reaction
postSchema.methods.addReaction = function(userId, reactionType) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString());
  
  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Remove reaction if same type
      this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
    } else {
      // Update reaction type
      existingReaction.type = reactionType;
    }
  } else {
    // Add new reaction
    this.reactions.push({ user: userId, type: reactionType });
  }
  
  return this.save();
};

// Method to add view
postSchema.methods.addView = function(userId) {
  if (!this.views.includes(userId)) {
    this.views.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add comment
postSchema.methods.addComment = function(userId, text, userInfo) {
  const comment = {
    user: {
      name: userInfo.name,
      avatar: userInfo.avatar,
      userId: userId
    },
    text: text
  };
  
  this.comments.push(comment);
  return this.save();
};

// Method to add reply
postSchema.methods.addReply = function(commentId, userId, text, userInfo) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.replies.push({
      user: {
        name: userInfo.name,
        avatar: userInfo.avatar,
        userId: userId
      },
      text: text
    });
    return this.save();
  }
  return Promise.reject(new Error('Comment not found'));
};

// Method to toggle like
postSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(likeIndex, 1);
  }
  
  return this.save();
};

// Method to toggle save
postSchema.methods.toggleSave = function(userId) {
  const saveIndex = this.savedBy.indexOf(userId);
  
  if (saveIndex === -1) {
    this.savedBy.push(userId);
  } else {
    this.savedBy.splice(saveIndex, 1);
  }
  
  return this.save();
};

// Method to share post
postSchema.methods.sharePost = function(userId, shareMessage, userInfo) {
  const sharedPost = new this.constructor({
    user: {
      name: userInfo.name,
      avatar: userInfo.avatar,
      userId: userId
    },
    content: shareMessage || `Shared: ${this.content}`,
    media: this.media,
    isShared: true,
    originalPost: this._id,
    shareMessage: shareMessage,
    privacy: 'public'
  });
  
  this.shares.push(userId);
  return Promise.all([sharedPost.save(), this.save()]);
};

module.exports = mongoose.model('Post', postSchema);
