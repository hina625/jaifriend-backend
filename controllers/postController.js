const Post = require('../models/post');
const User = require('../models/user');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

// Helper function to construct full URLs with proper slash handling
const constructFullUrl = (baseUrl, path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

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

    // Get user images from UserImage model
    const UserImage = require('../models/userImage');
    const userImage = await UserImage.findOne({ userId });
    const userAvatar = userImage?.avatar || user.avatar || '/avatars/1.png.png';

    // Handle media files
    let media = [];
    console.log('📁 File upload debugging:');
    console.log('  - req.files:', req.files);
    console.log('  - req.files length:', req.files?.length);
    console.log('  - req.body:', req.body);
    
    if (req.files && req.files.length > 0) {
      console.log('📁 Processing files:', req.files.length);
      media = req.files.map((file, index) => {
        console.log(`📁 File ${index + 1}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          filename: file.filename
        });
        
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        // Cloudinary provides secure URLs directly
        const mediaItem = {
          url: file.path, // Cloudinary secure URL
          publicId: file.filename, // Cloudinary public ID for deletion
          type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
          thumbnail: isVideo ? file.path.replace('/upload/', '/upload/w_300,h_300,c_fill/') : null,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        };
        
        console.log(`📁 Created media item ${index + 1}:`, mediaItem);
        return mediaItem;
      });
    } else {
      console.log('📁 No files uploaded');
    }
    
    console.log('📁 Final media array:', media);

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
      user: { userId, name: user.name, avatar: userAvatar },
      userId
    });

    console.log('📝 Post object before saving:', {
      content: post.content,
      media: post.media,
      mediaLength: post.media?.length,
      userId: post.userId
    });

    await post.save();
    
    console.log('📝 Post saved successfully:', {
      id: post._id,
      media: post.media,
      mediaLength: post.media?.length
    });

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
    console.log('🔍 getAllPosts called');
    
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(50);
    
    console.log(`🔍 Found ${posts.length} posts`);
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      console.log(`🔍 Processing post ${postObj._id}:`, {
        hasMedia: !!postObj.media,
        mediaLength: postObj.media?.length,
        mediaUrls: postObj.media?.map(m => m.url),
        mediaType: typeof postObj.media,
        isArray: Array.isArray(postObj.media),
        mediaKeys: postObj.media ? Object.keys(postObj.media) : null,
        rawMedia: postObj.media
      });
      
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = constructFullUrl(baseUrl, media.url);
            console.log(`🔗 Converting media URL: ${media.url} -> ${fullUrl}`);
            media.url = fullUrl;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = constructFullUrl(baseUrl, media.thumbnail);
            console.log(`🔗 Converting thumbnail URL: ${media.thumbnail} -> ${fullUrl}`);
            media.thumbnail = fullUrl;
          }
          return media;
        });
      }
      return postObj;
    });
    
    console.log(`✅ Returning ${postsWithFullUrls.length} posts with full URLs`);
    res.json(postsWithFullUrls);
  } catch (error) {
    console.error('❌ Error in getAllPosts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get posts by current user
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('🔍 getUserPosts called for userId:', userId);
    
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
    
    console.log(`🔍 Found ${posts.length} posts for user`);
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = constructFullUrl(baseUrl, media.url);
            console.log(`🔗 Converting media URL: ${media.url} -> ${fullUrl}`);
            media.url = fullUrl;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = constructFullUrl(baseUrl, media.thumbnail);
            console.log(`🔗 Converting thumbnail URL: ${media.thumbnail} -> ${fullUrl}`);
            media.thumbnail = fullUrl;
          }
          return media;
        });
      }
      return postObj;
    });
    
    console.log(`✅ Returning ${postsWithFullUrls.length} posts with full URLs`);
    res.json(postsWithFullUrls);
  } catch (err) {
    console.error('❌ Error in getUserPosts:', err);
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
            media.url = constructFullUrl(baseUrl, media.url);
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            media.thumbnail = constructFullUrl(baseUrl, media.thumbnail);
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
    console.log('🔍 Fetching saved posts for user:', userId);
    
    const posts = await Post.find({ savedBy: userId })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar');
    
    console.log('✅ Found', posts.length, 'saved posts for user:', userId);
    res.json(posts);
  } catch (err) {
    console.error('❌ Error fetching saved posts:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log('🗑️ Deleting post:', id);
    console.log('👤 User ID:', userId);

    const post = await Post.findById(id);
    if (!post) {
      console.log('❌ Post not found:', id);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('📋 Post found:', {
      postId: post._id,
      postUserId: post.user?.userId,
      postUser: post.user,
      requestingUserId: userId
    });

    // Check if user is authorized to delete this post
    if (post.user?.userId?.toString() !== userId) {
      console.log('❌ Unauthorized delete attempt:', {
        postUserId: post.user?.userId?.toString(),
        requestingUserId: userId
      });
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated media files from Cloudinary
    if (post.media && post.media.length > 0) {
      const { deleteFromCloudinary } = require('../config/cloudinary');
      
      for (const mediaItem of post.media) {
        if (mediaItem.publicId) {
          try {
            await deleteFromCloudinary(mediaItem.publicId);
            console.log('✅ Media file deleted from Cloudinary:', mediaItem.publicId);
          } catch (fileError) {
            console.error('❌ Error deleting media file from Cloudinary:', fileError);
          }
        }
      }
    }

    // Delete the post from database
    console.log('💾 Deleting post from database...');
    await Post.findByIdAndDelete(id);
    
    console.log('✅ Post deleted successfully:', id);
    res.json({ 
      message: 'Post deleted successfully',
      postId: id
    });
  } catch (err) {
    console.error('❌ Error deleting post:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Handle specific error types
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid post ID format',
        error: err.message 
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error deleting post',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Toggle like on a post
exports.toggleLike = async (req, res) => {
  try {
    console.log('🔍 toggleLike called with params:', req.params);
    console.log('🔍 req.userId:', req.userId);
    console.log('🔍 req.user:', req.user);
    
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      console.log('❌ No userId found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('🔍 Looking for post with ID:', id);
    const post = await Post.findById(id);
    
    if (!post) {
      console.log('❌ Post not found with ID:', id);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('✅ Post found:', post._id);
    console.log('🔍 Current likes:', post.likes);
    console.log('🔍 User ID to toggle:', userId);

    const likeIndex = post.likes.indexOf(userId);
    console.log('🔍 Like index:', likeIndex);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      console.log('❌ Removed like, new likes:', post.likes);
    } else {
      post.likes.push(userId);
      console.log('✅ Added like, new likes:', post.likes);
      
      // Create notification for post owner when someone likes their post
      if (post.user?.userId?.toString() !== userId.toString()) {
        console.log('🔔 Creating notification for post owner');
        const { createNotification } = require('./notificationController');
        const currentUser = await User.findById(userId);
        
        if (currentUser) {
          await createNotification({
            userId: post.user?.userId,
            type: 'post_like',
            title: 'New Like',
            message: `${currentUser.name} liked your post`,
            relatedUserId: userId,
            relatedPostId: post._id
          });
          console.log('🔔 Notification created successfully');
        } else {
          console.log('❌ Current user not found for notification');
        }
      } else {
        console.log('🔍 Post owner liking their own post, no notification needed');
      }
    }

    await post.save();
    console.log('💾 Post saved successfully');
    
    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');
    
    const response = { 
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      post: post,
      likes: post.likes.length,
      isLiked: likeIndex === -1
    };
    
    console.log('✅ Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error in toggleLike:', err);
    res.status(500).json({ error: err.message });
  }
};

// Toggle save on a post
exports.toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log('🎯 Toggle save request for post:', id, 'by user:', userId);

    const post = await Post.findById(id);
    if (!post) {
      console.log('❌ Post not found:', id);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('📋 Current savedBy:', post.savedBy);
    const saveIndex = post.savedBy.indexOf(userId);
    console.log('🔍 Save index:', saveIndex);

    if (saveIndex > -1) {
      post.savedBy.splice(saveIndex, 1);
      console.log('❌ Removed user from savedBy');
    } else {
      post.savedBy.push(userId);
      console.log('✅ Added user to savedBy');
    }

    await post.save();
    console.log('💾 Post saved, new savedBy:', post.savedBy);
    
    // Populate user info for response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');
    
    res.json({ 
      message: saveIndex > -1 ? 'Post unsaved' : 'Post saved',
      post: post,
      savedBy: post.savedBy,
      saved: saveIndex === -1
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
    
    // Get user images from UserImage model
    const UserImage = require('../models/userImage');
    const userImage = await UserImage.findOne({ userId });
    const userAvatar = userImage?.avatar || user.avatar || '/avatars/1.png.png';
    
    const comment = {
      user: { userId, name: user.name, avatar: userAvatar },
      text,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Create notification for post owner when someone comments on their post
    if (post.user?.userId?.toString() !== userId.toString()) {
      const { createNotification } = require('./notificationController');
      
              await createNotification({
          userId: post.user?.userId,
          type: 'post_comment',
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

    if (post.user?.userId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Handle new media files
    let newMedia = [];
    if (req.files && req.files.length > 0) {
      newMedia = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        return {
          url: file.path, // Cloudinary secure URL
          publicId: file.filename, // Cloudinary public ID for deletion
          type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
          thumbnail: isVideo ? file.path.replace('/upload/', '/upload/w_300,h_300,c_fill/') : null,
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
    const { id: postId, commentId } = req.params;
    const userId = req.userId;

    console.log('🗑️ Deleting comment:', { postId, commentId, userId });

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      console.log('❌ Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('🔍 Comment user ID:', comment.user.userId.toString());
    console.log('🔍 Current user ID:', userId);
    console.log('🔍 Post user ID:', post.user.userId.toString());

    // Allow comment author OR post owner to delete comment
    if (comment.user.userId.toString() !== userId && post.user.userId.toString() !== userId) {
      console.log('❌ Unauthorized to delete comment');
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(commentId);
    await post.save();

    console.log('✅ Comment removed, saving post...');

    // Populate the post with user info before sending response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');

    console.log('✅ Post populated, sending response');

    res.json({ 
      message: 'Comment deleted successfully',
      post: post
    });
  } catch (err) {
    console.error('❌ Error deleting comment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Share a post
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, shareTo, shareOnTimeline, shareToPage, shareToGroup, socialPlatforms } = req.body;
    const userId = req.userId;

    console.log('📤 Post share request:', {
      postId: id,
      userId,
      message,
      shareTo,
      shareOnTimeline,
      shareToPage,
      shareToGroup,
      socialPlatforms
    });

    const originalPost = await Post.findById(id).populate('user.userId', 'name avatar username');
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
    let shareResults = [];

    // Share on timeline
    if (shareOnTimeline) {
      try {
        const timelinePost = new Post({
          content: message || `Shared: ${originalPost.content}`,
          isShared: true,
          originalPost: originalPost._id,
          user: {
            name: currentUser.name,
            avatar: currentUser.avatar || '/avatars/1.png.png',
            userId: currentUser._id
          },
          userId: currentUser._id,
          privacy: shareTo === 'public' ? 'public' : 'friends',
          shareMessage: message,
          // Add original post media to shared post
          media: originalPost.media || [],
          sharedFrom: {
            postId: originalPost._id,
            userId: originalPost.user?.userId,
            userName: originalPost.user?.name,
            userAvatar: originalPost.user?.avatar
          }
        });
        
        await timelinePost.save();
        sharedPosts.push(timelinePost);
        shareCount++;
        console.log('Post shared to timeline:', timelinePost._id);
      } catch (postError) {
        console.error('Error creating timeline post:', postError);
      }
    }

    // Share to page (if implemented)
    if (shareToPage) {
      try {
        // TODO: Implement page sharing
        console.log('📄 Page sharing not yet implemented');
        shareResults.push('Page (not implemented)');
      } catch (error) {
        console.error('❌ Error sharing to page:', error);
        shareResults.push('Page (failed)');
      }
    }

    // Share to group (if implemented)
    if (shareToGroup) {
      try {
        // TODO: Implement group sharing
        console.log('👥 Group sharing not yet implemented');
        shareResults.push('Group (not implemented)');
      } catch (error) {
        console.error('❌ Error sharing to group:', error);
        shareResults.push('Group (failed)');
      }
    }

    // Handle social media sharing
    if (socialPlatforms && socialPlatforms.length > 0) {
      socialPlatforms.forEach(platform => {
        shareResults.push(`${platform} (external)`);
      });
    }

    // Add user to original post's shares array if not already there
    if (!originalPost.shares.includes(userId)) {
      originalPost.shares.push(userId);
      await originalPost.save();
    }

    // Create notification for original post owner
    if (originalPost.user?.userId?.toString() !== userId.toString()) {
      try {
        const { createNotification } = require('./notificationController');
        
        await createNotification({
          userId: originalPost.user?.userId,
          type: 'share',
          title: 'Post Shared',
          message: `${currentUser.name} shared your post`,
          relatedUserId: userId,
          relatedPostId: originalPost._id
        });
      } catch (error) {
        console.error('❌ Error creating notification:', error);
      }
    }

    // Populate shared posts for response
    for (let post of sharedPosts) {
      await post.populate('user.userId', 'name avatar username');
      await post.populate('comments.user.userId', 'name avatar');
      await post.populate('likes', 'name avatar');
      await post.populate('savedBy', 'name avatar');
      await post.populate('views', 'name avatar');
    }

    console.log('✅ Post share completed successfully:', {
      postId: originalPost._id,
      sharesCount: originalPost.shares.length,
      sharedPostsCount: sharedPosts.length,
      shareResults
    });

    res.json({ 
      post: originalPost,
      sharedPosts,
      shares: originalPost.shares,
      shared: true,
      shareCount,
      shareResults,
      message: `Post shared successfully to ${shareCount} location${shareCount !== 1 ? 's' : ''}`
    });
  } catch (err) {
    console.error('❌ Share post error:', err);
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
