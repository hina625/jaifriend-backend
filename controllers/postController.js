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
    console.log('📥 Received request body:', req.body);
    console.log('📥 Request headers:', req.headers);
    
    const { 
      content, 
      title, 
      privacy = 'public', 
      location, 
      hashtags,
      postType = 'text',
      audio,
      voice,
      gif,
      feeling,
      sell,
      poll,
      files,
      pageId,
      groupId
    } = req.body;
    const userId = req.userId;
    
    console.log('📥 Extracted data:', {
      content: content ? `${content.substring(0, 50)}...` : 'undefined',
      title,
      privacy,
      postType,
      userId,
      pageId,
      hasAudio: !!audio,
      hasVoice: !!voice,
      hasGif: !!gif,
      hasFeeling: !!feeling,
      hasSell: !!sell,
      hasPoll: !!poll,
      hasFiles: !!files
    });

    // Get user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user avatar - prioritize UserImage model, then user.avatar
    let userAvatar = null;
    try {
      const UserImage = require('../models/userImage');
      const userImage = await UserImage.findOne({ userId });
      userAvatar = userImage?.avatar || user.avatar;
      
      // Always include the avatar, even if it's a default one
      // Frontend will handle displaying the appropriate avatar
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

    console.log('👤 User avatar resolved:', {
      userId,
      userName: user.name || user.username,
      userAvatar,
      hasCustomAvatar: !!userAvatar
    });
    
    // Debug user data
    console.log('👤 User data for post:', {
      userId,
      userName: user.name,
      username: user.username,
      userAvatar,
      userObject: {
        userId,
        name: user.name || user.username,
        avatar: userAvatar
      }
    });

    // Handle media files
    let media = [];
    console.log('📁 File upload debugging:');
    console.log('  - req.files:', req.files);
    console.log('  - req.files length:', req.files?.length);
    console.log('  - req.body:', req.body);
    console.log('  - Content-Type header:', req.headers['content-type']);
    console.log('  - User-Agent:', req.headers['user-agent']);
    console.log('  - Authorization header present:', !!req.headers['authorization']);
    console.log('  - User ID from token:', req.userId);
    
    try {
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
          
          // Validate file upload success
          if (!file.path) {
            console.error(`❌ File ${index + 1} upload failed: No path returned`);
            throw new Error(`File upload failed for ${file.originalname}`);
          }
          
          const isVideo = file.mimetype.startsWith('video/');
          const isAudio = file.mimetype.startsWith('audio/');
          const isGif = file.mimetype === 'image/gif';
          const isDocument = file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/');
          const isPdf = file.mimetype === 'application/pdf';
          const isMp3 = file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3';
          
          // Determine media type with better precision
          let mediaType = 'image'; // default
          if (isVideo) mediaType = 'video';
          else if (isAudio) mediaType = 'audio';
          else if (isGif) mediaType = 'gif';
          else if (isPdf) mediaType = 'document'; // PDFs are documents
          else if (isMp3) mediaType = 'audio';
          else if (isDocument) mediaType = 'document';
          
          // Cloudinary provides secure URLs directly
          const mediaItem = {
            url: file.path, // Cloudinary secure URL
            publicId: file.filename, // Cloudinary public ID for deletion
            type: mediaType,
            thumbnail: isVideo ? file.path.replace('/upload/', '/upload/w_300,h_300,c_fill/') : null,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            extension: file.originalname.split('.').pop().toLowerCase(),
            uploadedAt: new Date(),
            // Add specific metadata for different file types
            isPdf: isPdf,
            isAudio: isAudio,
            isVideo: isVideo,
            isImage: !isVideo && !isAudio && !isDocument && !isPdf
          };
          
          console.log(`📁 Created media item ${index + 1}:`, mediaItem);
          return mediaItem;
        });
      } else {
        console.log('📁 No files uploaded');
      }
    } catch (fileError) {
      console.error('❌ Error processing uploaded files:', fileError);
      return res.status(400).json({
        message: 'File processing error',
        error: fileError.message
      });
    }
    
    console.log('📁 Final media array:', media);
    
    // Validate media array
    if (media && media.length > 0) {
      console.log('🔍 Validating media items...');
      media.forEach((item, index) => {
        console.log(`  📁 Media ${index + 1}:`, {
          hasUrl: !!item.url,
          url: item.url,
          hasType: !!item.type,
          type: item.type,
          hasOriginalName: !!item.originalName,
          originalName: item.originalName
        });
        
        // Ensure required fields are present
        if (!item.url) {
          console.error(`❌ Media ${index + 1} missing URL`);
        }
        if (!item.type) {
          console.error(`❌ Media ${index + 1} missing type`);
        }
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

    // Prepare post data
    // Ensure content is not empty
    const postContent = content && content.trim() ? content.trim() : ' ';
    
    const postData = {
      content: `<pre class="whitespace-pre-wrap break-words font-sans">${postContent}</pre>`,
      title,
      media,
      privacy,
      hashtags: parsedHashtags,
      mentions,
      user: { 
        userId, 
        name: user.name || user.username || 'Unknown User', 
        avatar: userAvatar 
      },
      userId,
      postType,
      pageId,
      groupId
    };
    
    console.log('📝 Post data prepared:', {
      contentLength: postData.content?.length,
      mediaCount: postData.media?.length,
      userId: postData.userId,
      postType: postData.postType,
      pageId: postData.pageId
    });

    // Add audio data if provided
    if (audio) {
      postData.audio = {
        url: audio.url,
        duration: audio.duration,
        title: audio.title,
        artist: audio.artist,
        album: audio.album,
        waveform: audio.waveform
      };
    }

    // Add voice data if provided
    if (voice) {
      postData.voice = {
        url: voice.url,
        duration: voice.duration,
        transcription: voice.transcription,
        isPublic: voice.isPublic !== false
      };
    }

    // Add GIF data if provided
    if (gif) {
      postData.gif = {
        url: gif.url,
        source: gif.source || 'custom',
        tags: gif.tags || [],
        width: gif.width,
        height: gif.height
      };
    }

    // Add feeling data if provided
    if (feeling) {
      postData.feeling = {
        type: feeling.type,
        intensity: feeling.intensity || 5,
        emoji: feeling.emoji,
        description: feeling.description
      };
    }

    // Add sell data if provided
    if (sell) {
      postData.sell = {
        productId: sell.productId,
        price: sell.price,
        currency: sell.currency || 'USD',
        condition: sell.condition || 'new',
        negotiable: sell.negotiable || false,
        shipping: sell.shipping || false,
        pickup: sell.pickup !== false
      };
    }

    // Add poll data if provided
    if (poll && poll.question && poll.options && poll.options.length > 0) {
      postData.poll = {
        question: poll.question,
        options: poll.options.map(option => ({
          text: option.text,
          votes: [],
          voteCount: 0
        })),
        isMultipleChoice: poll.isMultipleChoice || false,
        allowCustomOptions: poll.allowCustomOptions || false,
        expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : null,
        isActive: true,
        totalVotes: 0
      };
    }

    // Add location data if provided
    if (location) {
      postData.location = {
        name: location.name,
        address: location.address,
        coordinates: location.coordinates,
        placeId: location.placeId,
        category: location.category,
        rating: location.rating
      };
    }

    // Add file attachments if provided
    if (files && files.length > 0) {
      postData.files = files.map(file => ({
        fileId: file.fileId,
        name: file.name,
        size: file.size,
        type: file.type
      }));
    }

    const post = new Post(postData);

    console.log('📝 Post object before saving:', {
      content: post.content,
      media: post.media,
      mediaLength: post.media?.length,
      userId: post.userId,
      postType: post.postType,
      hasPoll: !!post.poll,
      hasFeeling: !!post.feeling,
      hasLocation: !!post.location,
      hasSell: !!post.sell,
      hasAudio: !!post.audio,
      hasVoice: !!post.voice,
      hasGif: !!post.gif,
      hasFiles: !!post.files
    });

    console.log('💾 Attempting to save post to database...');
    
    // Validate required fields before saving
    console.log('🔍 Validating post data before save:');
    console.log('  - content:', !!postData.content, 'length:', postData.content?.length);
    console.log('  - userId:', !!postData.userId);
    console.log('  - user.name:', !!postData.user?.name);
    console.log('  - user.userId:', !!postData.user?.userId);
    console.log('  - media:', postData.media?.length || 0);
    
    // Check for required fields
    if (!postData.content || postData.content.trim().length === 0) {
      return res.status(400).json({
        message: 'Validation error',
        error: 'Post content is required',
        details: [{ field: 'content', message: 'Post content cannot be empty' }]
      });
    }
    
    if (!postData.userId) {
      return res.status(400).json({
        message: 'Validation error',
        error: 'User ID is required',
        details: [{ field: 'userId', message: 'User ID is missing' }]
      });
    }
    
    if (!postData.user?.name) {
      return res.status(400).json({
        message: 'Validation error',
        error: 'User name is required',
        details: [{ field: 'user.name', message: 'User name is missing' }]
      });
    }
    
    try {
      await post.save();
      console.log('📝 Post saved successfully:', {
        id: post._id,
        media: post.media,
        mediaLength: post.media?.length,
        postType: post.postType
      });
    } catch (saveError) {
      console.error('❌ Error saving post to database:', saveError);
      throw saveError; // Re-throw to be caught by outer catch block
    }

    // Populate user info
    console.log('👤 Populating user info...');
    try {
      await post.populate('user.userId', 'name avatar username');
      console.log('✅ User info populated successfully');
    } catch (populateError) {
      console.error('❌ Error populating user info:', populateError);
      // Don't fail the request for populate errors
    }

    console.log('🚀 Sending response to client...');
    res.status(201).json(post);
  } catch (err) {
    console.error('❌ Error creating post:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Check if it's a database connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection error', 
        error: 'Unable to connect to database. Please try again later.' 
      });
    }
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      console.log('❌ Validation error details:', err.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        error: err.message,
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message,
          value: e.value,
          kind: e.kind
        }))
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Error creating post', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get all posts (for dashboard feed)
exports.getAllPosts = async (req, res) => {
  try {
    console.log('🔍 getAllPosts called');
    
    const posts = await Post.find({ 
      $and: [
        { groupId: { $exists: false } }, // Exclude group posts from main feed
        { pageId: { $exists: false } }   // Exclude page posts from main feed
      ]
    })
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
        rawMedia: postObj.media,
        userData: postObj.user
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

    // Get user avatar - prioritize UserImage model, then user.avatar
    let userAvatar = null;
    try {
      const UserImage = require('../models/userImage');
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
    const { content, title, privacy, location, hashtags } = req.body;
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
    post.title = title || post.title; // Add this line to update the title
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

// Edit a comment on a post
exports.editComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log('✏️ Editing comment:', { postId, commentId, userId, text });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

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

    // Only comment author can edit comment
    if (comment.user.userId.toString() !== userId) {
      console.log('❌ Unauthorized to edit comment');
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    // Update comment text
    comment.text = text.trim();
    comment.edited = true;
    comment.editedAt = new Date();
    
    await post.save();

    console.log('✅ Comment updated, saving post...');

    // Populate the post with user info before sending response
    await post.populate('user.userId', 'name avatar username');
    await post.populate('comments.user.userId', 'name avatar');
    await post.populate('likes', 'name avatar');
    await post.populate('savedBy', 'name avatar');
    await post.populate('views', 'name avatar');

    console.log('✅ Post populated, sending response');

    res.json({ 
      message: 'Comment updated successfully',
      comment: comment,
      post: post
    });
  } catch (err) {
    console.error('❌ Error editing comment:', err);
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
          content: `<pre class="whitespace-pre-wrap break-words font-sans">${message || `Shared: ${originalPost.content}`}</pre>`,
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

// Add review to a post
exports.addReview = async (req, res) => {
  try {
    const { rating, text } = req.body;
    const { id: postId } = req.params;
    const userId = req.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has already reviewed this post
    const existingReviewIndex = post.reviews.findIndex(review => 
      review.user.toString() === userId
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      post.reviews[existingReviewIndex].rating = rating;
      post.reviews[existingReviewIndex].text = text || '';
      post.reviews[existingReviewIndex].updatedAt = new Date();
    } else {
      // Add new review
      post.reviews.push({
        user: userId,
        rating,
        text: text || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Calculate average rating and review count
    const totalRating = post.reviews.reduce((sum, review) => sum + review.rating, 0);
    post.averageRating = totalRating / post.reviews.length;
    post.reviewCount = post.reviews.length;

    await post.save();

    // Populate user info for response
    await post.populate('reviews.user', 'name avatar username');

    res.json({
      message: 'Review added successfully',
      post: {
        _id: post._id,
        reviews: post.reviews,
        averageRating: post.averageRating,
        reviewCount: post.reviewCount
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save a post
exports.savePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post is already saved by user
    const isAlreadySaved = post.savedBy.includes(userId);

    if (isAlreadySaved) {
      // Remove from saved
      post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
      await post.save();
      
      res.json({
        message: 'Post removed from saved',
        saved: false,
        savedCount: post.savedBy.length
      });
    } else {
      // Add to saved
      post.savedBy.push(userId);
      await post.save();
      
      res.json({
        message: 'Post saved successfully',
        saved: true,
        savedCount: post.savedBy.length
      });
    }
  } catch (error) {
    console.error('Error saving/unsaving post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get saved posts for a user
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find posts saved by the user
    const savedPosts = await Post.find({
      savedBy: userId,
      privacy: { $ne: 'private' } // Don't show private posts
    })
    .populate('user.userId', 'name avatar username')
    .populate('comments.user.userId', 'name avatar username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const totalSavedPosts = await Post.countDocuments({
      savedBy: userId,
      privacy: { $ne: 'private' }
    });

    res.json({
      savedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSavedPosts / limit),
        totalPosts: totalSavedPosts,
        hasNextPage: page * limit < totalSavedPosts,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if a post is saved by current user
exports.checkPostSaved = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isSaved = post.savedBy.includes(userId);
    
    res.json({
      isSaved,
      savedCount: post.savedBy.length
    });
  } catch (error) {
    console.error('Error checking post saved status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle comments on a post
exports.toggleComments = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only post owner can toggle comments' });
    }

    // Toggle comments enabled
    post.commentsEnabled = !post.commentsEnabled;
    await post.save();

    res.json({
      message: `Comments ${post.commentsEnabled ? 'enabled' : 'disabled'} successfully`,
      commentsEnabled: post.commentsEnabled
    });
  } catch (error) {
    console.error('Error toggling comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Pin/Unpin a post
exports.pinPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only post owner can pin/unpin post' });
    }

    // Toggle pin status
    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      message: `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: post.isPinned
    });
  } catch (error) {
    console.error('Error pinning/unpinning post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Boost/Unboost a post
exports.boostPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only post owner can boost/unboost post' });
    }

    // Toggle boost status
    post.isBoosted = !post.isBoosted;
    await post.save();

    res.json({
      message: `Post ${post.isBoosted ? 'boosted' : 'unboosted'} successfully`,
      isBoosted: post.isBoosted
    });
  } catch (error) {
    console.error('Error boosting/unboosting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add poll vote
exports.addPollVote = async (req, res) => {
  try {
    const { postId, optionIndex } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.poll || !post.poll.question) {
      return res.status(400).json({ message: 'Post does not have a poll' });
    }

    await post.addPollVote(userId, optionIndex);
    
    res.json({ 
      message: 'Vote added successfully',
      poll: post.poll
    });
  } catch (err) {
    console.error('Error adding poll vote:', err);
    res.status(500).json({ message: 'Error adding poll vote', error: err.message });
  }
};

// Remove poll vote
exports.removePollVote = async (req, res) => {
  try {
    const { postId, optionIndex } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.poll || !post.poll.question) {
      return res.status(400).json({ message: 'Post does not have a poll' });
    }

    await post.removePollVote(userId, optionIndex);
    
    res.json({ 
      message: 'Vote removed successfully',
      poll: post.poll
    });
  } catch (err) {
    console.error('Error removing poll vote:', err);
    res.status(500).json({ message: 'Error removing poll vote', error: err.message });
  }
};

// Get posts by type
exports.getPostsByType = async (req, res) => {
  try {
    const { postType } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const validTypes = ['text', 'image', 'video', 'audio', 'file', 'gif', 'voice', 'feeling', 'sell', 'poll', 'location', 'mixed'];
    
    if (!validTypes.includes(postType)) {
      return res.status(400).json({ message: 'Invalid post type' });
    }

    const posts = await Post.find({ postType })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ postType });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts by type:', err);
    res.status(500).json({ message: 'Error getting posts by type', error: err.message });
  }
};

// Get posts with feelings
exports.getPostsWithFeelings = async (req, res) => {
  try {
    const { feelingType, page = 1, limit = 20 } = req.query;

    let query = { 'feeling.type': { $exists: true } };
    if (feelingType) {
      query['feeling.type'] = feelingType;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with feelings:', err);
    res.status(500).json({ message: 'Error getting posts with feelings', error: err.message });
  }
};

// Get posts with polls
exports.getPostsWithPolls = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'poll.question': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'poll.question': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with polls:', err);
    res.status(500).json({ message: 'Error getting posts with polls', error: err.message });
  }
};

// Get posts with location
exports.getPostsWithLocation = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'location.name': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'location.name': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with location:', err);
    res.status(500).json({ message: 'Error getting posts with location', error: err.message });
  }
};

// Get posts with sell info
exports.getPostsWithSell = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'sell.productId': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .populate('sell.productId')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'sell.productId': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with sell info:', err);
    res.status(500).json({ message: 'Error getting posts with sell info', error: err.message });
  }
};

// Get posts with audio
exports.getPostsWithAudio = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'audio.url': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'audio.url': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with audio:', err);
    res.status(500).json({ message: 'Error getting posts with audio', error: err.message });
  }
};

// Get posts with voice
exports.getPostsWithVoice = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'voice.url': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'voice.url': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with voice:', err);
    res.status(500).json({ message: 'Error getting posts with voice', error: err.message });
  }
};

// Get posts with files
exports.getPostsWithFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'files.0': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .populate('files.fileId')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'files.0': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with files:', err);
    res.status(500).json({ message: 'Error getting posts with files', error: err.message });
  }
};

// Get posts with GIFs
exports.getPostsWithGifs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ 'gif.url': { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ 'gif.url': { $exists: true } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting posts with GIFs:', err);
    res.status(500).json({ message: 'Error getting posts with GIFs', error: err.message });
  }
};
