const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },
  avatar: {
    type: String,
    default: null
  },
  coverPhoto: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'business', 'education', 'entertainment', 'health', 'sports', 'technology', 'travel', 'other']
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  website: String,
  email: String,
  phone: String,
  rules: [{
    title: String,
    description: String,
    order: Number
  }],
  settings: {
    allowMemberPosts: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowMedia: {
      type: Boolean,
      default: true
    },
    maxMediaPerPost: {
      type: Number,
      default: 10
    },
    autoApproveMembers: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    memberCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },
    eventCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ privacy: 1, category: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ featured: 1, createdAt: -1 });

// Pre-save middleware to update member count
groupSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.stats.memberCount = this.members.length;
  }
  next();
});

// Method to add member
groupSchema.methods.addMember = async function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    existingMember.role = role;
    existingMember.isActive = true;
  } else {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return await this.save();
};

// Method to remove member
groupSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return await this.save();
};

// Method to update member role
groupSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.role = newRole;
    return await this.save();
  }
  throw new Error('Member not found');
};

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString() && m.isActive);
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.creator.toString() === userId.toString() || 
         this.admins.includes(userId) ||
         this.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');
};

// Method to check if user is moderator
groupSchema.methods.isModerator = function(userId) {
  return this.isAdmin(userId) ||
         this.moderators.includes(userId) ||
         this.members.some(m => m.user.toString() === userId.toString() && m.role === 'moderator');
};

// Method to check if user can post
groupSchema.methods.canPost = function(userId) {
  if (!this.settings.allowMemberPosts) return false;
  if (this.isAdmin(userId) || this.isModerator(userId)) return true;
  return this.isMember(userId);
};

// Static method to get public groups
groupSchema.statics.getPublicGroups = function() {
  return this.find({ privacy: 'public', isActive: true })
    .populate('creator', 'name username avatar')
    .populate('members.user', 'name username avatar')
    .sort({ 'stats.memberCount': -1, createdAt: -1 });
};

// Static method to search groups
groupSchema.statics.searchGroups = function(query, userId) {
  return this.find({
    $and: [
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      },
      {
        $or: [
          { privacy: 'public' },
          { 'members.user': userId },
          { creator: userId }
        ]
      },
      { isActive: true }
    ]
  })
  .populate('creator', 'name username avatar')
  .populate('members.user', 'name username avatar')
  .sort({ 'stats.memberCount': -1, createdAt: -1 });
};

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for admin count
groupSchema.virtual('adminCount').get(function() {
  return this.admins.length + this.members.filter(m => m.role === 'admin').length + 1; // +1 for creator
});

module.exports = mongoose.model('Group', groupSchema); 