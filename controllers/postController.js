const Post = require('../models/post');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .limit(50);
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Create a new post (with optional media)
exports.createPost = async (req, res) => {
  try {
    // Use user info from req.user or fallback to anonymous
    const user = req.user || {
      name: 'Anonymous',
      avatar: '/avatars/1.png.png',
      userId: 'guest'
    };

    const post = new Post({
      user: {
        name: user.name,
        avatar: user.avatar,
        userId: user.id || user.userId
      },
      content: req.body.content,
      media: req.body.media || [],
      // ...any other fields you want to allow
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    console.log('Trying to delete post:', post._id, 'by user:', req.user ? req.user._id : 'no user');
    // Optionally: Only allow the owner to delete
    // if (String(post.user.userId) !== String(req.user._id)) return res.status(403).json({ message: 'Unauthorized' });

    // Delete media files if they exist
    if (post.media && post.media.length > 0) {
      post.media.forEach(media => {
        if (media.url && media.url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '..', media.url);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }
        }
      });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Like or unlike a post
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
      await post.save();
      return res.json({ message: 'Post liked', liked: true, likes: post.likes });
    } else {
      post.likes.splice(index, 1);
      await post.save();
      return res.json({ message: 'Post unliked', liked: false, likes: post.likes });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like' });
  }
};

// Save or unsave a post
exports.toggleSave = async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const saveIndex = post.savedBy.indexOf(userId);
    if (saveIndex > -1) {
      // Unsave
      post.savedBy.splice(saveIndex, 1);
    } else {
      // Save
      post.savedBy.push(userId);
    }
    
    await post.save();
    res.json({ savedBy: post.savedBy, saved: saveIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

// Get all saved posts for the logged-in user
exports.getSavedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.userId })
      .sort({ createdAt: -1 })
      .populate('savedBy', 'name avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved posts' });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });
    let user = { name: "Anonymous", avatar: "/avatars/1.png.png" };
    if (req.userId) {
      const dbUser = await User.findById(req.userId);
      if (dbUser) {
        user = {
          name: dbUser.username || dbUser.fullName || dbUser.name,
          avatar: dbUser.avatar || "/avatars/1.png.png",
          userId: dbUser._id
        };
      }
    }
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = {
      user: {
        name: user.name,
        avatar: user.avatar,
        userId: user.userId
      },
      text: text.trim(),
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();
    
    // Return the new comment
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ comment: newComment, message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Edit a post
exports.editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, mediaUrls } = req.body;
    let newMedia = [];

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      newMedia = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          url: `/uploads/${file.filename}`,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date()
        };
      });
    }

    // Handle media URLs
    if (mediaUrls) {
      let urls;
      try {
        urls = JSON.parse(mediaUrls);
      } catch {
        urls = [mediaUrls];
      }
      
      newMedia = newMedia.concat(urls.map(url => {
        const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
        return {
          url,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date()
        };
      }));
    }

    // Handle single file upload (backward compatibility)
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');
      newMedia.push({
        url: `/uploads/${req.file.filename}`,
        type: isVideo ? 'video' : 'image',
        uploadedAt: new Date()
      });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user.userId) !== String(req.userId)) return res.status(403).json({ message: 'Unauthorized' });
    
    if (content) post.content = content;
    if (newMedia.length > 0) {
      post.media = post.media.concat(newMedia);
    }
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error editing post' });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // Only comment owner or post owner can delete
    if (
      String(comment.user.userId) !== String(req.userId) &&
      String(post.user.userId) !== String(req.userId)
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    comment.remove();
    await post.save();
    res.json({ message: 'Comment deleted', post });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment' });
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
    .limit(50);
    
    // Transform posts to video format for watch page
    const videos = posts.flatMap(post => 
      post.media
        .filter(media => media.type === 'video')
        .map(media => ({
          _id: `${post._id}_${media._id}`,
          user: {
            name: post.user.name,
            username: post.user.name,
            avatar: post.user.avatar,
            verified: false,
            isPro: false,
            userId: post.user.userId
          },
          title: post.content,
          description: post.content,
          videoUrl: media.url,
          videoThumbnail: media.url,
          isYoutube: false,
          isSponsored: false,
          category: 'post',
          likes: post.likes,
          views: [], // Posts don't have views tracking
          comments: post.comments.map(comment => ({
            _id: comment._id,
            user: {
              name: comment.user.name,
              avatar: comment.user.avatar,
              userId: comment.user.userId
            },
            text: comment.text,
            createdAt: comment.createdAt
          })),
          shares: post.shares || [], // Posts now have shares tracking
          savedBy: post.savedBy,
          createdAt: post.createdAt
        }))
    );
    
    res.json(videos);
  } catch (err) {
    console.error('Error fetching posts with videos:', err);
    res.status(500).json({ message: 'Error fetching posts with videos' });
  }
};

// Get posts with media (images and videos) for feed
exports.getPostsWithMedia = async (req, res) => {
  try {
    const posts = await Post.find({
      'media.url': { $exists: true, $ne: null }
    })
    .sort({ createdAt: -1 })
    .populate('user.userId', 'name avatar username')
    .populate('comments.user.userId', 'name avatar')
    .populate('likes', 'name avatar')
    .populate('savedBy', 'name avatar')
    .limit(50);
    
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts with media:', err);
    res.status(500).json({ message: 'Error fetching posts with media' });
  }
};

// Share post
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.userId;
    const shareIndex = post.shares.indexOf(userId);
    if (shareIndex > -1) {
      post.shares.splice(shareIndex, 1);
    } else {
      post.shares.push(userId);
    }
    await post.save();
    res.json({ shares: post.shares, shared: shareIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing post', error: err.message });
  }
};

exports.getPopularPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .limit(10);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get the most engaged post (highest likes + comments + views)
exports.getMostEngagedPost = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts.length) return res.json(null);
    // Calculate engagement score for each post
    const postsWithScore = posts.map(post => ({
      post,
      score: (post.likes?.length || 0) + (post.comments?.length || 0) + (post.views?.length || 0)
    }));
    // Find the post with the highest score
    const mostEngaged = postsWithScore.reduce((max, curr) => curr.score > max.score ? curr : max, postsWithScore[0]);
    res.json(mostEngaged.post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
