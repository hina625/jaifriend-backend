const Story = require('../models/story');
const User = require('../models/user');
const UserImage = require('../models/userImage');

// Helper function to construct full URL
const constructFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://jaifriend-backend-production.up.railway.app'
    : 'http://localhost:3001';
  
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { content, privacy = 'public' } = req.body;
    const userId = req.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user avatar - prioritize UserImage model, then user.avatar
    let userAvatar = null;
    try {
      const userImage = await UserImage.findOne({ userId });
      userAvatar = userImage?.avatar || user.avatar;
      
      // Always include the avatar, even if it's a default one
      if (!userAvatar) {
        userAvatar = '/avatars/1.png.png'; // Use default avatar path
      }
    } catch (error) {
      console.log('⚠️ UserImage model not found, using user.avatar directly');
      userAvatar = user.avatar;
      
      // Always include the avatar, even if it's a default one
      if (!userAvatar) {
        userAvatar = '/avatars/1.png.png'; // Use default avatar path
      }
    }

    // Handle media file
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Construct media URL
    let mediaUrl = req.file.path;
    if (!mediaUrl.startsWith('http')) {
      mediaUrl = constructFullUrl(req.file.path);
    }

    // Create story
    const story = new Story({
      userId,
      content,
      media: mediaUrl,
      mediaType,
      privacy,
      thumbnail: mediaType === 'video' ? mediaUrl : null // For now, use same URL for thumbnail
    });

    await story.save();

    // Populate user info for response
    await story.populate('userId', 'username avatar fullName');

    res.status(201).json({
      message: 'Story created successfully',
      story: {
        ...story.toObject(),
        user: {
          _id: story.userId._id,
          username: story.userId.username,
          avatar: userAvatar, // Use the properly constructed avatar
          fullName: story.userId.fullName
        }
      }
    });

  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Failed to create story' });
  }
};

// Get all active stories for feed
exports.getFeedStories = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's friends/following list (you can implement this based on your user model)
    // For now, we'll get all public stories
    const stories = await Story.getFeedStories();
    
    // Process stories to add user info and format URLs
    const processedStories = await Promise.all(stories.map(async (story) => {
      const storyObj = story.toObject();
      
      // Get user avatar - prioritize UserImage model, then user.avatar
      let userAvatar = null;
      try {
        const userImage = await UserImage.findOne({ userId: storyObj.userId._id });
        userAvatar = userImage?.avatar || storyObj.userId.avatar;
        
        // Always include the avatar, even if it's a default one
        if (!userAvatar) {
          userAvatar = '/avatars/1.png.png'; // Use default avatar path
        }
      } catch (error) {
        console.log('⚠️ UserImage model not found, using user.avatar directly');
        userAvatar = storyObj.userId.avatar;
        
        // Always include the avatar, even if it's a default one
        if (!userAvatar) {
          userAvatar = '/avatars/1.png.png'; // Use default avatar path
        }
      }
      
      return {
        ...storyObj,
        user: {
          _id: storyObj.userId._id,
          username: storyObj.userId.username,
          avatar: userAvatar, // Use the properly constructed avatar
          fullName: storyObj.userId.fullName
        },
        media: constructFullUrl(storyObj.media),
        thumbnail: storyObj.thumbnail ? constructFullUrl(storyObj.thumbnail) : null
      };
    }));

    res.json({
      message: 'Stories retrieved successfully',
      stories: processedStories
    });

  } catch (error) {
    console.error('Error getting feed stories:', error);
    res.status(500).json({ message: 'Failed to get stories' });
  }
};

// Get stories by specific user
exports.getUserStories = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.userId;

    // Check if current user can view target user's stories
    // For now, we'll allow viewing public stories
    const stories = await Story.getStoriesByUser(targetUserId);
    
    const processedStories = await Promise.all(stories.map(async (story) => {
      const storyObj = story.toObject();
      
      // Get user avatar - prioritize UserImage model, then user.avatar
      let userAvatar = null;
      try {
        const userImage = await UserImage.findOne({ userId: storyObj.userId._id });
        userAvatar = userImage?.avatar || storyObj.userId.avatar;
        
        // Always include the avatar, even if it's a default one
        if (!userAvatar) {
          userAvatar = '/avatars/1.png.png'; // Use default avatar path
        }
      } catch (error) {
        console.log('⚠️ UserImage model not found, using user.avatar directly');
        userAvatar = storyObj.userId.avatar;
        
        // Always include the avatar, even if it's a default one
        if (!userAvatar) {
          userAvatar = '/avatars/1.png.png'; // Use default avatar path
        }
      }
      
      return {
        ...storyObj,
        user: {
          _id: storyObj.userId._id,
          username: storyObj.userId.username,
          avatar: userAvatar, // Use the properly constructed avatar
          fullName: storyObj.userId.fullName
        },
        media: constructFullUrl(storyObj.media),
        thumbnail: storyObj.thumbnail ? constructFullUrl(storyObj.thumbnail) : null
      };
    }));

    res.json({
      message: 'User stories retrieved successfully',
      stories: processedStories
    });

  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({ message: 'Failed to get user stories' });
  }
};

// View a story
exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!story.isActive || story.isExpired()) {
      return res.status(404).json({ message: 'Story is no longer available' });
    }

    // Check if user already viewed this story
    const alreadyViewed = story.views.some(view => view.userId.toString() === userId);
    
    if (!alreadyViewed) {
      story.views.push({ userId });
      await story.save();
    }

    res.json({
      message: 'Story viewed successfully',
      views: story.views.length
    });

  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({ message: 'Failed to view story' });
  }
};

// React to a story
exports.reactToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { reactionType = 'like' } = req.body;
    const userId = req.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!story.isActive || story.isExpired()) {
      return res.status(404).json({ message: 'Story is no longer available' });
    }

    // Check if user already reacted
    const existingReactionIndex = story.reactions.findIndex(
      reaction => reaction.userId.toString() === userId
    );

    if (existingReactionIndex !== -1) {
      // Update existing reaction
      story.reactions[existingReactionIndex].type = reactionType;
      story.reactions[existingReactionIndex].createdAt = new Date();
    } else {
      // Add new reaction
      story.reactions.push({ userId, type: reactionType });
    }

    await story.save();

    res.json({
      message: 'Reaction added successfully',
      reactions: story.reactions
    });

  } catch (error) {
    console.error('Error reacting to story:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
};

// Reply to a story
exports.replyToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!story.isActive || story.isExpired()) {
      return res.status(404).json({ message: 'Story is no longer available' });
    }

    story.replies.push({ userId, content: content.trim() });
    await story.save();

    // Populate user info for the new reply
    await story.populate('replies.userId', 'username avatar fullName');

    const newReply = story.replies[story.replies.length - 1];

    res.json({
      message: 'Reply added successfully',
      reply: {
        ...newReply.toObject(),
        user: {
          _id: newReply.userId._id,
          username: newReply.userId.username,
          avatar: constructFullUrl(newReply.userId.avatar),
          fullName: newReply.userId.fullName
        }
      }
    });

  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({ message: 'Story deleted successfully' });

  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Failed to delete story' });
  }
};

// Get story statistics
exports.getStoryStats = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user can view stats (owner or public story)
    if (story.userId.toString() !== userId && story.privacy !== 'public') {
      return res.status(403).json({ message: 'Not authorized to view story stats' });
    }

    const stats = {
      views: story.views.length,
      reactions: story.reactions.length,
      replies: story.replies.length,
      timeLeft: Math.max(0, story.expiresAt.getTime() - Date.now()),
      isExpired: story.isExpired()
    };

    res.json({
      message: 'Story stats retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Error getting story stats:', error);
    res.status(500).json({ message: 'Failed to get story stats' });
  }
};

// Cleanup expired stories (this should be called by a cron job)
exports.cleanupExpiredStories = async () => {
  try {
    const expiredStories = await Story.find({
      isActive: true,
      expiresAt: { $lte: new Date() }
    });

    for (const story of expiredStories) {
      story.isActive = false;
      await story.save();
    }

    console.log(`Cleaned up ${expiredStories.length} expired stories`);
    return expiredStories.length;

  } catch (error) {
    console.error('Error cleaning up expired stories:', error);
    return 0;
  }
};
