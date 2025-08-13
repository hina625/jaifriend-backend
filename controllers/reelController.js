const Reel = require('../models/reel');
const User = require('../models/user');
const { generateThumbnail } = require('../config/cloudinary');

// Get all reels with pagination and filtering
exports.getReels = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, hashtag, trending, userId } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { privacy: 'everyone' };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by hashtag
    if (hashtag) {
      query.hashtags = { $regex: hashtag, $options: 'i' };
    }
    
    // Filter by user
    if (userId) {
      query['user.userId'] = userId;
    }
    
    // Sort by trending or creation date
    let sort = {};
    if (trending === 'true') {
      sort = { trendingScore: -1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 };
    }
    
    const reels = await Reel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user.userId', 'name avatar username verified isPro')
      .populate('comments.user.userId', 'name avatar username');
    
    const total = await Reel.countDocuments(query);
    
    res.json({
      reels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReels: total,
        hasNextPage: skip + reels.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching reels:', err);
    res.status(500).json({ message: 'Error fetching reels', error: err.message });
  }
};

// Get trending reels
exports.getTrendingReels = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const reels = await Reel.find({ 
      privacy: 'everyone',
      isTrending: true 
    })
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user.userId', 'name avatar username verified isPro');
    
    res.json(reels);
  } catch (err) {
    console.error('Error fetching trending reels:', err);
    res.status(500).json({ message: 'Error fetching trending reels', error: err.message });
  }
};

// Get reels by user
exports.getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { 'user.userId': userId };
    
    // If requesting user's own reels, include private ones
    if (req.userId === userId) {
      // No privacy filter for own reels
    } else {
      // For other users, only show public reels
      query.privacy = 'everyone';
    }
    
    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user.userId', 'name avatar username verified isPro');
    
    const total = await Reel.countDocuments(query);
    
    res.json({
      reels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReels: total,
        hasNextPage: skip + reels.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching user reels:', err);
    res.status(500).json({ message: 'Error fetching user reels', error: err.message });
  }
};

// Create a new reel
exports.createReel = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      hashtags, 
      duration, 
      aspectRatio, 
      music, 
      effects, 
      privacy, 
      category,
      location 
    } = req.body;
    
    let videoUrl = null;
    let thumbnailUrl = null;
    
    // Handle uploaded video file
    if (req.file) {
      videoUrl = req.file.path || `/uploads/${req.file.filename}`;
      
      // Generate thumbnail if Cloudinary is available
      if (req.file.cloudinary_id) {
        try {
          thumbnailUrl = await generateThumbnail(req.file.cloudinary_id);
        } catch (error) {
          console.log('Could not generate thumbnail:', error.message);
        }
      }
    }
    
    // Handle video URL (from external sources)
    if (req.body.videoUrl) {
      videoUrl = req.body.videoUrl;
    }
    
    // Handle thumbnail URL
    if (req.body.thumbnailUrl) {
      thumbnailUrl = req.body.thumbnailUrl;
    }
    
    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required.' });
    }
    
    if (!duration) {
      return res.status(400).json({ message: 'Video duration is required.' });
    }
    
    let user = { 
      name: "Anonymous", 
      username: "anonymous",
      avatar: "/avatars/1.png.png",
      verified: false,
      isPro: false
    };
    
    if (req.userId) {
      const dbUser = await User.findById(req.userId);
      if (dbUser) {
        user = {
          name: dbUser.fullName || dbUser.username || dbUser.name,
          username: dbUser.username || dbUser.name,
          avatar: dbUser.avatar || "/avatars/1.png.png",
          verified: dbUser.verified || false,
          isPro: dbUser.isPro || false,
          userId: dbUser._id
        };
      }
    }
    
    // Parse hashtags if they come as a string
    let parsedHashtags = hashtags;
    if (typeof hashtags === 'string') {
      parsedHashtags = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const reel = new Reel({
      user,
      title,
      description,
      hashtags: parsedHashtags || [],
      videoUrl,
      thumbnailUrl,
      duration: parseFloat(duration),
      aspectRatio: aspectRatio || '9:16',
      music: music || null,
      effects: effects || [],
      privacy: privacy || 'everyone',
      category: category || 'general',
      location: location || null
    });
    
    await reel.save();
    
    // Populate user info for response
    await reel.populate('user.userId', 'name avatar username verified isPro');
    
    res.status(201).json(reel);
  } catch (err) {
    console.error('Error creating reel:', err);
    res.status(500).json({ message: 'Error creating reel', error: err.message });
  }
};

// Get reel by ID
exports.getReelById = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('user.userId', 'name avatar username verified isPro')
      .populate('comments.user.userId', 'name avatar username');
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    // Check privacy settings
    if (reel.privacy === 'private' && reel.user.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'This reel is private' });
    }
    
    // Add view if user is authenticated and hasn't viewed before
    if (req.userId && !reel.views.includes(req.userId)) {
      reel.views.push(req.userId);
      await reel.save();
    }
    
    res.json(reel);
  } catch (err) {
    console.error('Error fetching reel:', err);
    res.status(500).json({ message: 'Error fetching reel', error: err.message });
  }
};

// Like/Unlike reel
exports.toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const userId = req.userId;
    const likeIndex = reel.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      reel.likes.splice(likeIndex, 1);
    } else {
      // Like
      reel.likes.push(userId);
    }
    
    // Update trending score
    reel.trendingScore = calculateTrendingScore(reel);
    
    await reel.save();
    res.json({ 
      likes: reel.likes, 
      liked: likeIndex === -1,
      trendingScore: reel.trendingScore
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

// Share reel
exports.shareReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const userId = req.userId;
    if (!reel.shares.includes(userId)) {
      reel.shares.push(userId);
      reel.trendingScore = calculateTrendingScore(reel);
      await reel.save();
    }
    
    res.json({ 
      shares: reel.shares,
      trendingScore: reel.trendingScore
    });
  } catch (err) {
    console.error('Error sharing reel:', err);
    res.status(500).json({ message: 'Error sharing reel', error: err.message });
  }
};

// Save/Unsave reel
exports.toggleSave = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const userId = req.userId;
    const saveIndex = reel.savedBy.indexOf(userId);
    
    if (saveIndex > -1) {
      // Unsave
      reel.savedBy.splice(saveIndex, 1);
    } else {
      // Save
      reel.savedBy.push(userId);
    }
    
    await reel.save();
    res.json({ 
      saved: reel.savedBy, 
      isSaved: saveIndex === -1
    });
  } catch (err) {
    console.error('Error toggling save:', err);
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

// Add comment to reel
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const comment = {
      user: {
        name: user.fullName || user.username || user.name,
        avatar: user.avatar || "/avatars/1.png.png",
        userId: user._id
      },
      text: text.trim()
    };
    
    reel.comments.push(comment);
    reel.trendingScore = calculateTrendingScore(reel);
    await reel.save();
    
    res.json({ 
      comment,
      totalComments: reel.comments.length,
      trendingScore: reel.trendingScore
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Delete comment from reel
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    
    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const comment = reel.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    // Check if user owns the comment or the reel
    if (comment.user.userId.toString() !== req.userId && 
        reel.user.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    comment.remove();
    reel.trendingScore = calculateTrendingScore(reel);
    await reel.save();
    
    res.json({ 
      message: 'Comment deleted successfully',
      totalComments: reel.comments.length,
      trendingScore: reel.trendingScore
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Update reel
exports.updateReel = async (req, res) => {
  try {
    const { title, description, hashtags, privacy, category, music, effects, location } = req.body;
    
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    // Check if user owns the reel
    if (reel.user.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this reel' });
    }
    
    // Parse hashtags if they come as a string
    let parsedHashtags = hashtags;
    if (typeof hashtags === 'string') {
      parsedHashtags = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Update fields
    if (title !== undefined) reel.title = title;
    if (description !== undefined) reel.description = description;
    if (parsedHashtags !== undefined) reel.hashtags = parsedHashtags;
    if (privacy !== undefined) reel.privacy = privacy;
    if (category !== undefined) reel.category = category;
    if (music !== undefined) reel.music = music;
    if (effects !== undefined) reel.effects = effects;
    if (location !== undefined) reel.location = location;
    
    await reel.save();
    
    // Populate user info for response
    await reel.populate('user.userId', 'name avatar username verified isPro');
    
    res.json(reel);
  } catch (err) {
    console.error('Error updating reel:', err);
    res.status(500).json({ message: 'Error updating reel', error: err.message });
  }
};

// Delete reel
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    // Check if user owns the reel
    if (reel.user.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }
    
    await reel.remove();
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    console.error('Error deleting reel:', err);
    res.status(500).json({ message: 'Error deleting reel', error: err.message });
  }
};

// Get reels by hashtag
exports.getReelsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const reels = await Reel.find({ 
      hashtags: { $regex: hashtag, $options: 'i' },
      privacy: 'everyone'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user.userId', 'name avatar username verified isPro');
    
    const total = await Reel.countDocuments({ 
      hashtags: { $regex: hashtag, $options: 'i' },
      privacy: 'everyone'
    });
    
    res.json({
      reels,
      hashtag,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReels: total,
        hasNextPage: skip + reels.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching reels by hashtag:', err);
    res.status(500).json({ message: 'Error fetching reels by hashtag', error: err.message });
  }
};

// Helper function to calculate trending score
function calculateTrendingScore(reel) {
  const now = new Date();
  const hoursSinceCreation = (now - reel.createdAt) / (1000 * 60 * 60);
  
  // Base score from engagement
  let score = reel.likes.length * 2 + reel.comments.length * 3 + reel.shares.length * 4 + reel.views.length;
  
  // Time decay factor (newer content gets higher score)
  const timeDecay = Math.max(0.1, 1 - (hoursSinceCreation / 24)); // Decay over 24 hours
  
  // Trending boost
  if (reel.isTrending) {
    score *= 1.5;
  }
  
  return Math.round(score * timeDecay);
}
