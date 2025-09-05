const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    votedAt: { type: Date, default: Date.now }
  }],
  voteCount: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema({
  question: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  options: [pollOptionSchema],
  isMultipleChoice: { type: Boolean, default: false },
  allowCustomOptions: { type: Boolean, default: false },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  totalVotes: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
pollSchema.index({ postId: 1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ expiresAt: 1 });

// Method to add vote
pollSchema.methods.addVote = function(userId, optionIndex) {
  if (optionIndex < 0 || optionIndex >= this.options.length) {
    throw new Error('Invalid option index');
  }

  const option = this.options[optionIndex];
  
  // Check if user already voted for this option
  const existingVote = option.votes.find(vote => vote.user.toString() === userId.toString());
  if (existingVote) {
    throw new Error('User already voted for this option');
  }

  // Add vote
  option.votes.push({ user: userId });
  option.voteCount += 1;
  this.totalVotes += 1;

  return this.save();
};

// Method to remove vote
pollSchema.methods.removeVote = function(userId, optionIndex) {
  if (optionIndex < 0 || optionIndex >= this.options.length) {
    throw new Error('Invalid option index');
  }

  const option = this.options[optionIndex];
  const voteIndex = option.votes.findIndex(vote => vote.user.toString() === userId.toString());
  
  if (voteIndex === -1) {
    throw new Error('User has not voted for this option');
  }

  // Remove vote
  option.votes.splice(voteIndex, 1);
  option.voteCount -= 1;
  this.totalVotes -= 1;

  return this.save();
};

// Method to check if poll is expired
pollSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('Poll', pollSchema);
