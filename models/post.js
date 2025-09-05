const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    avatar: { type: String, default: '/avatars/1.png.png' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Add groupId field
  content: { type: String, required: true, maxlength: 50000 },
  title: { type: String, maxlength: 100 },
  
  // Post type and category
  postType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'file', 'gif', 'voice', 'feeling', 'sell', 'poll', 'location', 'mixed'],
    default: 'text'
  },
  
  // Media files (images, videos, audio, files, documents)
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'audio', 'file', 'gif', 'pdf', 'document'], default: 'image' },
      thumbnail: { type: String },
      duration: { type: Number }, // for videos/audio
      size: { type: Number }, // file size in bytes
      originalName: { type: String },
      mimetype: { type: String },
      extension: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  
  // Audio specific fields
  audio: {
    url: { type: String },
    duration: { type: Number }, // in seconds
    title: { type: String, maxlength: 200 },
    artist: { type: String, maxlength: 200 },
    album: { type: String, maxlength: 200 },
    waveform: [{ type: Number }] // for audio visualization
  },
  
  // Voice recording specific fields
  voice: {
    url: { type: String },
    duration: { type: Number }, // in seconds
    transcription: { type: String }, // AI transcription if available
    isPublic: { type: Boolean, default: true }
  },
  
  // GIF specific fields
  gif: {
    url: { type: String },
    source: { type: String }, // e.g., 'giphy', 'tenor', 'custom'
    tags: [{ type: String }],
    width: { type: Number },
    height: { type: Number }
  },
  
  // Feeling/Emotion specific fields
  feeling: {
    type: { type: String },
    intensity: { type: Number, min: 1, max: 10 },
    emoji: { type: String },
    description: { type: String, maxlength: 200 }
  },
  
  // Product selling specific fields
  sell: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    price: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    condition: { type: String, enum: ['new', 'used', 'refurbished'] },
    negotiable: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false },
    pickup: { type: Boolean, default: true }
  },
  
  // Poll specific fields
  poll: {
    question: { type: String, maxlength: 500 },
    options: [{
      text: { type: String, maxlength: 200 },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      voteCount: { type: Number, default: 0 }
    }],
    isMultipleChoice: { type: Boolean, default: false },
    allowCustomOptions: { type: Boolean, default: false },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    totalVotes: { type: Number, default: 0 }
  },
  
  // Location specific fields
  location: {
    name: { type: String },
    address: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    placeId: { type: String }, // Google Places ID
    category: { type: String }, // restaurant, park, etc.
    rating: { type: Number, min: 0, max: 5 }
  },
  
  // File attachments
  files: [{
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    name: { type: String },
    size: { type: Number },
    type: { type: String }
  }],
  
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
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
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
postSchema.index({ pageId: 1, createdAt: -1 });
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

// Method to add poll vote
postSchema.methods.addPollVote = function(userId, optionIndex) {
  if (!this.poll || !this.poll.options || optionIndex < 0 || optionIndex >= this.poll.options.length) {
    throw new Error('Invalid poll or option');
  }

  const option = this.poll.options[optionIndex];
  
  // Check if user already voted
  const existingVote = option.votes.find(vote => vote.toString() === userId.toString());
  if (existingVote) {
    throw new Error('User already voted for this option');
  }

  // Add vote
  option.votes.push(userId);
  option.voteCount += 1;
  this.poll.totalVotes += 1;

  return this.save();
};

// Method to remove poll vote
postSchema.methods.removePollVote = function(userId, optionIndex) {
  if (!this.poll || !this.poll.options || optionIndex < 0 || optionIndex >= this.poll.options.length) {
    throw new Error('Invalid poll or option');
  }

  const option = this.poll.options[optionIndex];
  const voteIndex = option.votes.findIndex(vote => vote.toString() === userId.toString());
  
  if (voteIndex === -1) {
    throw new Error('User has not voted for this option');
  }

  // Remove vote
  option.votes.splice(voteIndex, 1);
  option.voteCount -= 1;
  this.poll.totalVotes -= 1;

  return this.save();
};

// Method to add file attachment
postSchema.methods.addFile = function(fileData) {
  if (!this.files) {
    this.files = [];
  }
  
  this.files.push(fileData);
  return this.save();
};

// Method to remove file attachment
postSchema.methods.removeFile = function(fileId) {
  if (!this.files) return this.save();
  
  this.files = this.files.filter(file => file.fileId.toString() !== fileId.toString());
  return this.save();
};

// Method to set feeling
postSchema.methods.setFeeling = function(feelingData) {
  this.feeling = feelingData;
  return this.save();
};

// Method to set location
postSchema.methods.setLocation = function(locationData) {
  this.location = locationData;
  return this.save();
};

// Method to set sell information
postSchema.methods.setSellInfo = function(sellData) {
  this.sell = sellData;
  return this.save();
};

// Method to set audio information
postSchema.methods.setAudioInfo = function(audioData) {
  this.audio = audioData;
  return this.save();
};

// Method to set voice information
postSchema.methods.setVoiceInfo = function(voiceData) {
  this.voice = voiceData;
  return this.save();
};

// Method to set GIF information
postSchema.methods.setGifInfo = function(gifData) {
  this.gif = gifData;
  return this.save();
};

// Method to check if post has poll
postSchema.methods.hasPoll = function() {
  return this.poll && this.poll.question;
};

// Method to check if post has feeling
postSchema.methods.hasFeeling = function() {
  return this.feeling && this.feeling.type;
};

// Method to check if post has location
postSchema.methods.hasLocation = function() {
  return this.location && (this.location.name || this.location.coordinates);
};

// Method to check if post has sell info
postSchema.methods.hasSellInfo = function() {
  return this.sell && this.sell.productId;
};

// Method to check if post has audio
postSchema.methods.hasAudio = function() {
  return this.audio && this.audio.url;
};

// Method to check if post has voice
postSchema.methods.hasVoice = function() {
  return this.voice && this.voice.url;
};

// Method to check if post has GIF
postSchema.methods.hasGif = function() {
  return this.gif && this.gif.url;
};

// Method to check if post has files
postSchema.methods.hasFiles = function() {
  return this.files && this.files.length > 0;
};

// Method to get post type based on content
postSchema.methods.determinePostType = function() {
  if (this.media && this.media.length > 0) {
    const mediaTypes = [...new Set(this.media.map(m => m.type))];
    if (mediaTypes.length > 1) {
      return 'mixed';
    }
    return mediaTypes[0] || 'text';
  }
  
  if (this.poll && this.poll.question) return 'poll';
  if (this.feeling && this.feeling.type) return 'feeling';
  if (this.location && this.location.name) return 'location';
  if (this.sell && this.sell.productId) return 'sell';
  if (this.audio && this.audio.url) return 'audio';
  if (this.voice && this.voice.url) return 'voice';
  if (this.gif && this.gif.url) return 'gif';
  if (this.files && this.files.length > 0) return 'file';
  
  return 'text';
};

// Pre-save middleware to set post type
postSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('media') || this.isModified('poll') || 
      this.isModified('feeling') || this.isModified('location') || this.isModified('sell') ||
      this.isModified('audio') || this.isModified('voice') || this.isModified('gif') ||
      this.isModified('files')) {
    this.postType = this.determinePostType();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
