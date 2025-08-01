const Post = require('../models/post');
const User = require('../models/user');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content, privacy = 'public', location, hashtags } = req.body;
    const userId = req.userId;

    // Get user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle media files
    let media = [];
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        // Generate full URL for media
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://jaifriend-backend-production.up.railway.app'
          : `${req.protocol}://${req.get('host')}`;
        
        return {
          url: `${baseUrl}/uploads/${file.filename}`,
          type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
          thumbnail: isVideo ? `${baseUrl}/uploads/thumb_${file.filename}` : null,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        };
      });
    }

    // Parse hashtags if provided as string
    let parsedHashtags = [];
    if (hashtags) {
      if (typeof hashtags === 'string') {
        parsedHashtags = hashtags.split(',').map(tag => tag.trim().replace('#', ''));
      } else if (Array.isArray(hashtags)) {
        parsedHashtags = hashtags.map(tag => tag.replace('#', ''));
      }
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }

    const post = new Post({
      content,
      media,
      privacy,
      location,
      hashtags: parsedHashtags,
      mentions,
      user: { userId, name: user.name, avatar: user.avatar || '/avatars/1.png.png' },
      userId
    });

    await post.save();

    // Populate user info
    await post.populate('user.userId', 'name avatar username');

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

// Get all posts (for dashboard feed)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(50);
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.url = `${baseUrl}${media.url}`;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.thumbnail = `${baseUrl}${media.thumbnail}`;
          }
          return media;
        });
      }
      return postObj;
    });
    
    res.json(postsWithFullUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get posts by current user
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const posts = await Post.find({ 
      $or: [
        { userId: userId },
        { 'user.userId': userId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar');
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.url = `${baseUrl}${media.url}`;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.thumbnail = `${baseUrl}${media.thumbnail}`;
          }
          return media;
        });
      }
      return postObj;
    });
    
    res.json(postsWithFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get posts by specific user ID (for profile pages)
exports.getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params || req.query;
    const currentUserId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get posts by the specific user - check both userId and user.userId fields
    const posts = await Post.find({ 
      $or: [
        { userId: userId },
        { 'user.userId': userId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar');
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.url = `${baseUrl}${media.url}`;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.thumbnail = `${baseUrl}${media.thumbnail}`;
          }
          return media;
        });
      }
      return postObj;
    });
    
    res.json(postsWithFullUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const posts = await Post.find({ savedBy: userId })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar');
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is authorized to delete this post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated media files from uploads folder
    if (post.media && post.media.length > 0) {
      const fs = require('fs');
      const path = require('path');
      
      for (const mediaItem of post.media) {
        if (mediaItem.filename) {
          const filePath = path.join(__dirname, '..', 'uploads', mediaItem.filename);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (fileError) {
            console.error('Error deleting media file:', fileError);
          }
        }
      }
    }

    // Delete the post from database
    await Post.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Post deleted successfully',
      postId: id
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error deleting post',
      error: err.message 
    });
  }
};

// Toggle like on a post
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
      
      // Create notification for post owner when someone likes their post
      if (post.userId.toString() !== userId.toString()) {
        const { createNotification } = require('./notificationController');
        const currentUser = await User.findById(userId);
        
        await createNotification({
          userId: post.userId,
          type: 'like',
          title: 'New Like',
          message: `${currentUser.name} liked your post`,
          relatedUserId: userId,
          relatedPostId: post._id
        });
      }
    }

    await post.save();
    
    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');
    
    res.json({ 
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      post: post,
      likes: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle save on a post
exports.toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const saveIndex = post.savedBy.indexOf(userId);
    if (saveIndex > -1) {
      post.savedBy.splice(saveIndex, 1);
    } else {
      post.savedBy.push(userId);
    }

    await post.save();
    
    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');
    
    res.json({ 
      message: saveIndex > -1 ? 'Post unsaved' : 'Post saved',
      post: post,
      saved: post.savedBy.length,
      isSaved: saveIndex === -1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add comment to a post
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    const comment = {
      user: { userId, name: user.name, avatar: user.avatar },
      text,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Create notification for post owner when someone comments on their post
    if (post.userId.toString() !== userId.toString()) {
      const { createNotification } = require('./notificationController');
      
      await createNotification({
        userId: post.userId,
        type: 'comment',
        title: 'New Comment',
        message: `${user.name} commented on your post`,
        relatedUserId: userId,
        relatedPostId: post._id
      });
    }

    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');

    res.json({ 
      message: 'Comment added successfully',
      post: post,
      comment,
      commentsCount: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit a post
exports.editPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, privacy, location, hashtags } = req.body;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Handle new media files
    let newMedia = [];
    if (req.files && req.files.length > 0) {
      newMedia = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        return {
          url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
          type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
          thumbnail: isVideo ? `${req.protocol}://${req.get('host')}/uploads/thumb_${file.filename}` : null,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        };
      });
    }

    // Parse hashtags
    let parsedHashtags = [];
    if (hashtags) {
      if (typeof hashtags === 'string') {
        parsedHashtags = hashtags.split(',').map(tag => tag.trim().replace('#', ''));
      } else if (Array.isArray(hashtags)) {
        parsedHashtags = hashtags.map(tag => tag.replace('#', ''));
      }
    }

    // Update post
    post.content = content || post.content;
    post.privacy = privacy || post.privacy;
    post.location = location || post.location;
    post.hashtags = parsedHashtags.length > 0 ? parsedHashtags : post.hashtags;
    
    if (newMedia.length > 0) {
      post.media = [...post.media, ...newMedia];
    }

    // Add to edit history
    post.editHistory.push({
      content: post.content,
      editedAt: new Date()
    });

    await post.save();
    res.json({ message: 'Post updated successfully', post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.json({ 
      message: 'Comment deleted successfully',
      commentsCount: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Share a post
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, shareTo, shareOnTimeline, shareToPage, shareToGroup } = req.body;
    const userId = req.userId;

    console.log('Post share request:', {
      postId: id,
      userId,
      message,
      shareTo,
      shareOnTimeline,
      shareToPage,
      shareToGroup
    });

    const originalPost = await Post.findById(id).populate('user', 'name avatar');
    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get current user info
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sharedPosts = [];
    let shareCount = 0;

    // Share on timeline
    if (shareOnTimeline) {
      const timelinePost = new Post({
        content: message || `Shared: ${originalPost.content}`,
        isShared: true,
        originalPost: originalPost._id,
        user: userId,
        userId,
        privacy: shareTo === 'public' ? 'public' : 'friends',
        shareMessage: message,
        sharedFrom: {
          postId: originalPost._id,
          userId: originalPost.userId,
          userName: originalPost.user?.name || 'Unknown User',
          userAvatar: originalPost.user?.avatar || '/avatars/1.png.png',
          postContent: originalPost.content,
          postMedia: originalPost.media
        }
      });
      
      await timelinePost.save();
      sharedPosts.push(timelinePost);
      shareCount++;
      console.log('Post shared to timeline as new post:', timelinePost._id);
    }

    // Share to page (if implemented)
    if (shareToPage) {
      // TODO: Implement page sharing
      console.log('Page sharing not yet implemented');
    }

    // Share to group (if implemented)
    if (shareToGroup) {
      // TODO: Implement group sharing
      console.log('Group sharing not yet implemented');
    }

    // Add user to original post's shares array if not already there
    if (!originalPost.shares.includes(userId)) {
      originalPost.shares.push(userId);
      await originalPost.save();
    }

    // Create notification for original post owner
    if (originalPost.userId.toString() !== userId.toString()) {
      const { createNotification } = require('./notificationController');
      
      await createNotification({
        userId: originalPost.userId,
        type: 'share',
        title: 'Post Shared',
        message: `${currentUser.name} shared your post`,
        relatedUserId: userId,
        relatedPostId: originalPost._id
      });
    }

    console.log('Post share completed successfully:', {
      postId: originalPost._id,
      sharesCount: originalPost.shares.length,
      sharedPostsCount: sharedPosts.length
    });

    res.json({ 
      post: originalPost,
      sharedPosts,
      shares: originalPost.shares,
      shared: true,
      shareCount,
      message: `Post shared successfully to ${shareCount} location${shareCount !== 1 ? 's' : ''}`
    });
  } catch (err) {
    console.error('Share post error:', err);
    res.status(500).json({ message: 'Error sharing post', error: err.message });
  }
};

// Add view to post
exports.addView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add view if user hasn't viewed before
    if (!post.views.includes(userId)) {
      post.views.push(userId);
      await post.save();
    }

    res.json({ 
      message: 'View added successfully',
      viewCount: post.views.length 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding view', error: err.message });
  }
};

// Add reaction to post
exports.addReaction = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const postId = req.params.id;
    const userId = req.userId;

    if (!reactionType || !['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already has a reaction
    const existingReactionIndex = post.reactions.findIndex(
      reaction => reaction.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      
      // If same reaction type, remove it (toggle off)
      if (existingReaction.type === reactionType) {
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // If different reaction type, update it
        existingReaction.type = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date()
      });
    }

    await post.save();
    
    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('reactions.user', 'name avatar');

    res.json({
      message: 'Reaction updated successfully',
      post: post,
      reactionCount: post.reactions.length
    });
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ message: 'Error adding reaction', error: err.message });
  }
};

// Get posts with media (for feed)
exports.getPostsWithMedia = async (req, res) => {
  try {
    const posts = await Post.find({
      'media.0': { $exists: true }
    })
    .sort({ createdAt: -1 })
    .populate('user.userId', 'name avatar username')
    .populate('comments.user.userId', 'name avatar')
    .populate('likes', 'name avatar')
    .populate('savedBy', 'name avatar')
    .populate('views', 'name avatar')
    .limit(50);
    
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts with media:', err);
    res.status(500).json({ message: 'Error fetching posts with media' });
  }
};

// Get posts with videos (for watch page)
exports.getPostsWithVideos = async (req, res) => {
  try {
    const posts = await Post.find({
      'media.type': 'video'
    })
    .sort({ createdAt: -1 })
    .populate('user.userId', 'name avatar username')
    .populate('comments.user.userId', 'name avatar')
    .populate('likes', 'name avatar')
    .populate('savedBy', 'name avatar')
    .populate('views', 'name avatar')
    .limit(50);
    
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts with videos:', err);
    res.status(500).json({ message: 'Error fetching posts with videos' });
  }
};

// Get popular posts
exports.getPopularPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ totalEngagement: -1, createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(20);
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get most engaged post
exports.getMostEngagedPost = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts.length) return res.json(null);
    
    const postsWithEngagement = posts.map(post => ({
      post,
      engagement: post.totalEngagement
    }));
    
    const mostEngaged = postsWithEngagement.reduce((max, curr) => 
      curr.engagement > max.engagement ? curr : max, postsWithEngagement[0]
    );
    
    await mostEngaged.post.populate('user.userId', 'name avatar username');
    res.json(mostEngaged.post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get posts by hashtag
exports.getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const posts = await Post.find({
      hashtags: { $in: [hashtag] }
    })
    .sort({ createdAt: -1 })
    .populate('user.userId', 'name avatar username')
    .populate('comments.user.userId', 'name avatar')
    .populate('likes', 'name avatar')
    .populate('savedBy', 'name avatar')
    .populate('views', 'name avatar')
    .limit(50);
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get trending hashtags
exports.getTrendingHashtags = async (req, res) => {
  try {
    const posts = await Post.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    const hashtagCounts = {};
    posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      });
    });
    
    const trending = Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([hashtag, count]) => ({ hashtag, count }));
    
    res.json(trending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
