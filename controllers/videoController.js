const Video = require('../models/video');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Get all videos (for watch page)
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .limit(50);
    res.json(videos);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// Create a new video
exports.createVideo = async (req, res) => {
  try {
    const { title, description, hashtag, isYoutube, isSponsored, category } = req.body;
    let videoUrl = null;
    let videoThumbnail = null;

    // Handle uploaded video file
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    }

    // Handle video URL (from external sources)
    if (req.body.videoUrl) {
      videoUrl = req.body.videoUrl;
    }

    // Handle thumbnail
    if (req.body.videoThumbnail) {
      videoThumbnail = req.body.videoThumbnail;
    }

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required.' });
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

    const video = new Video({
      user,
      title,
      description,
      hashtag,
      videoUrl,
      videoThumbnail,
      isYoutube: isYoutube || false,
      isSponsored: isSponsored || false,
      category: category || 'general'
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error('Error creating video:', err);
    res.status(500).json({ message: 'Error creating video', error: err.message });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Add view if user is authenticated
    if (req.userId && !video.views.includes(req.userId)) {
      video.views.push(req.userId);
      await video.save();
    }

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching video' });
  }
};

// Like/Unlike video
exports.toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const userId = req.userId;
    const likeIndex = video.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      video.likes.splice(likeIndex, 1);
    } else {
      // Like
      video.likes.push(userId);
    }
    
    await video.save();
    res.json({ likes: video.likes, liked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

// Share video
exports.shareVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const userId = req.userId;
    const shareIndex = video.shares.indexOf(userId);
    
    if (shareIndex > -1) {
      // Unshare
      video.shares.splice(shareIndex, 1);
    } else {
      // Share
      video.shares.push(userId);
    }
    
    await video.save();
    res.json({ shares: video.shares, shared: shareIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing video', error: err.message });
  }
};

// Save/Unsave video
exports.toggleSave = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    
    const userId = req.userId;
    const saveIndex = video.savedBy.indexOf(userId);
    
    if (saveIndex > -1) {
      // Unsave
      video.savedBy.splice(saveIndex, 1);
    } else {
      // Save
      video.savedBy.push(userId);
    }
    
    await video.save();
    res.json({ savedBy: video.savedBy, saved: saveIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

// Add comment to video
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    let user = { 
      name: "Anonymous", 
      avatar: "/avatars/1.png.png",
      userId: null
    };

    if (req.userId) {
      const dbUser = await User.findById(req.userId);
      if (dbUser) {
        user = {
          name: dbUser.fullName || dbUser.username || dbUser.name,
          avatar: dbUser.avatar || "/avatars/1.png.png",
          userId: dbUser._id
        };
      }
    }

    video.comments.push({
      user,
      text: text.trim()
    });
    
    await video.save();
    await video.populate('comments.user.userId', 'name avatar');
    
    const newComment = video.comments[video.comments.length - 1];
    res.json({ comment: newComment, message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Delete comment from video
exports.deleteComment = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const commentId = req.params.commentId;
    const comment = video.comments.id(commentId);
    
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    // Check if user is comment owner or video owner
    if (String(comment.user.userId) !== String(req.userId) && String(video.user.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }
    
    video.comments.pull(commentId);
    await video.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (String(video.user.userId) !== String(req.userId)) return res.status(403).json({ message: 'Unauthorized' });

    // Delete video file if exists
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting video', error: err.message });
  }
};

// Get videos by category
exports.getVideosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const videos = await Video.find({ category })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .limit(20);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching videos by category' });
  }
}; 