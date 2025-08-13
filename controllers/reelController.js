const Reel = require('../models/reel');
const User = require('../models/user');

// Get all reels with pagination and filtering
exports.getReels = async (req, res) => {
  try {
    console.log('🎬 getReels called with query:', req.query);
    console.log('🔐 Auth headers:', req.headers.authorization ? 'Present' : 'Missing');
    
    const { page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (category) query.category = category;
    
    console.log('🔍 Database query:', query);
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    console.log('📊 Sort options:', sortOptions);
    
    // Check total count first
    const total = await Reel.countDocuments(query);
    console.log('📈 Total reels in database:', total);
    
    // If no reels, return empty response with proper structure
    if (total === 0) {
      console.log('📭 No reels found, returning empty response');
      const response = {
        reels: [],
        pagination: {
          totalPages: 0,
          currentPage: parseInt(page),
          total: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
      console.log('📤 Sending empty response:', response);
      return res.json(response);
    }
    
    const reels = await Reel.find(query)
      .populate('user', 'name username avatar verified isPro')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    console.log('📋 Found reels:', reels.length);
    console.log('📄 Page info:', { page, limit, totalPages: Math.ceil(total / limit) });
    
    const response = {
      reels,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error getting reels:', error);
    res.status(500).json({ error: 'Failed to get reels' });
  }
};

// Get trending reels
exports.getTrendingReels = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const reels = await Reel.find({ isTrending: true })
      .populate('user', 'name username avatar verified isPro')
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .exec();
    
    res.json({ reels });
  } catch (error) {
    console.error('Error getting trending reels:', error);
    res.status(500).json({ error: 'Failed to get trending reels' });
  }
};

// Get reels by hashtag
exports.getReelsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reels = await Reel.find({ hashtags: { $regex: hashtag, $options: 'i' } })
      .populate('user', 'name username avatar verified isPro')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Reel.countDocuments({ hashtags: { $regex: hashtag, $options: 'i' } });
    
    res.json({
      reels,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting reels by hashtag:', error);
    res.status(500).json({ error: 'Failed to get reels by hashtag' });
  }
};

// Get reels by user
exports.getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reels = await Reel.find({ 'user.userId': userId })
      .populate('user', 'name username avatar verified isPro')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Reel.countDocuments({ 'user.userId': userId });
    
    res.json({
      reels,
        totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting user reels:', error);
    res.status(500).json({ error: 'Failed to get user reels' });
  }
};

// Get reel by ID
exports.getReelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reel = await Reel.findById(id)
      .populate('user', 'name username avatar verified isPro')
      .exec();
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    res.json({ reel });
  } catch (error) {
    console.error('Error getting reel by ID:', error);
    res.status(500).json({ error: 'Failed to get reel' });
  }
};

// Create a new reel
exports.createReel = async (req, res) => {
  try {
    console.log('🎬 Create reel request received');
    console.log('👤 User ID:', req.user.id);
    console.log('📁 File:', req.file);
    console.log('📋 Body:', req.body);
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', user.username);
    
    const { 
      title, 
      description, 
      hashtags = [],
      duration, 
      aspectRatio = '9:16',
      music,
      effects = [],
      privacy = 'everyone',
      category = 'general'
    } = req.body;
    
    // Handle video upload
    let videoUrl = '';
    if (req.file) {
      videoUrl = req.file.path || req.file.secure_url;
      console.log('📹 Video file uploaded:', videoUrl);
    } else {
      console.log('❌ No video file received');
    }
    
    const reelData = {
      user: {
        name: user.name || user.username,
        username: user.username,
        avatar: user.avatar || '',
        verified: user.verified || false,
        isPro: user.isPro || false,
        userId: user._id
      },
      title,
      description,
      hashtags: Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(tag => tag.trim()),
      videoUrl,
      duration: parseFloat(duration) || 0,
      aspectRatio, 
      music, 
      effects, 
      privacy, 
      category,
      likes: [],
      views: [],
      comments: [],
      shares: [],
      savedBy: [],
      bookmarks: [],
      isTrending: false,
      trendingScore: 0,
      isSponsored: false
    };
    
    console.log('📊 Reel data prepared:', reelData);
    
    const reel = new Reel(reelData);
    await reel.save();
    
    console.log('✅ Reel saved successfully:', reel._id);
    
    res.status(201).json({ 
      message: 'Reel created successfully',
      reel 
    });
  } catch (error) {
    console.error('❌ Error creating reel:', error);
    res.status(500).json({ error: 'Failed to create reel' });
  }
};

// Update reel
exports.updateReel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    // Check if user owns the reel
    if (reel.user.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this reel' });
    }
    
    const updateData = req.body;
    delete updateData.user; // Prevent updating user info
    
    const updatedReel = await Reel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name username avatar verified isPro');
    
    res.json({ 
      message: 'Reel updated successfully',
      reel: updatedReel 
    });
  } catch (error) {
    console.error('Error updating reel:', error);
    res.status(500).json({ error: 'Failed to update reel' });
  }
};

// Delete reel
exports.deleteReel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    // Check if user owns the reel
    if (reel.user.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this reel' });
    }
    
    await Reel.findByIdAndDelete(id);
    
    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    res.status(500).json({ error: 'Failed to delete reel' });
  }
};

// Toggle like on reel
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const likeIndex = reel.likes.indexOf(userId);
    if (likeIndex > -1) {
      reel.likes.splice(likeIndex, 1);
    } else {
      reel.likes.push(userId);
    }
    
    await reel.save();
    
    res.json({ 
      message: 'Like toggled successfully',
      isLiked: reel.likes.includes(userId),
      likesCount: reel.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Share reel
exports.shareReel = async (req, res) => {
  try {
    console.log('🔄 Share reel request received:', req.params);
    console.log('👤 User ID:', req.user.id);
    
    const { id } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      console.log('❌ Reel not found:', id);
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    console.log('📹 Reel found:', reel._id);
    console.log('📊 Current shares:', reel.shares);
    
    if (!reel.shares.includes(userId)) {
      reel.shares.push(userId);
      await reel.save();
      console.log('✅ User added to shares');
    } else {
      console.log('ℹ️ User already in shares');
    }
    
    const response = { 
      message: 'Reel shared successfully',
      shares: reel.shares,
      trendingScore: reel.trendingScore || 0
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error sharing reel:', error);
    res.status(500).json({ error: 'Failed to share reel' });
  }
};

// Toggle save on reel
exports.toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const saveIndex = reel.savedBy.indexOf(userId);
    if (saveIndex > -1) {
      reel.savedBy.splice(saveIndex, 1);
    } else {
      reel.savedBy.push(userId);
    }
    
    await reel.save();
    
    res.json({ 
      message: 'Save toggled successfully',
      isSaved: reel.savedBy.includes(userId),
      savesCount: reel.savedBy.length
    });
  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
};

// Add comment to reel
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const comment = {
      user: {
        name: user.name || user.username,
        avatar: user.avatar || '',
        userId: user._id
      },
      text: text.trim(),
      createdAt: new Date()
    };
    
    reel.comments.push(comment);
    await reel.save();
    
    res.json({ 
      message: 'Comment added successfully',
      comment,
      commentsCount: reel.comments.length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Delete comment from reel
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment or the reel
    if (comment.user.userId.toString() !== userId && reel.user.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    comment.remove();
    await reel.save();
    
    res.json({ 
      message: 'Comment deleted successfully',
      commentsCount: reel.comments.length
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
