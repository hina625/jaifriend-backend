const Album = require('../models/album');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Create a new album with multiple photos/videos or URLs
exports.createAlbum = async (req, res) => {
  try {
    const { name } = req.body;
    let media = [];

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          url: `/uploads/${file.filename}`,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date()
        };
      });
    }

    // Handle media URLs (from e.g. Cloudinary)
    if (req.body.mediaUrls) {
      let urls;
      try {
        urls = JSON.parse(req.body.mediaUrls);
      } catch {
        urls = [req.body.mediaUrls];
      }
      
      media = media.concat(urls.map(url => {
        const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
        return {
          url,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date()
        };
      }));
    }

    if (!name) {
      return res.status(400).json({ message: 'Album name is required.' });
    }

    const album = new Album({
      user: req.user?.id, // Use req.user.id as set by the auth middleware
      name,
      media
    });
    await album.save();
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    res.status(201).json(album);
  } catch (err) {
    console.error('Error creating album:', err);
    res.status(500).json({ message: 'Error creating album', error: err.message });
  }
};

// Edit album (update name, add more media)
exports.editAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (String(album.user) !== String(req.userId)) return res.status(403).json({ message: 'Unauthorized' });

    if (req.body.name) album.name = req.body.name;

    let newMedia = [];
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
    if (req.body.mediaUrls) {
      let urls;
      try {
        urls = JSON.parse(req.body.mediaUrls);
      } catch {
        urls = [req.body.mediaUrls];
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
    if (newMedia.length > 0) {
      album.media = album.media.concat(newMedia);
    }
    await album.save();
    await album.populate('user', 'name avatar');
    res.json(album);
  } catch (err) {
    res.status(500).json({ message: 'Error editing album', error: err.message });
  }
};

// Delete album and its media
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (String(album.user) !== String(req.userId)) return res.status(403).json({ message: 'Unauthorized' });

    // Optionally delete local files (if not using cloud storage)
    if (album.media && album.media.length > 0) {
      album.media.forEach(media => {
        if (media.url && media.url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '..', media.url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }
    await album.deleteOne();
    res.json({ message: 'Album deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting album', error: err.message });
  }
};

// Get all albums for the logged-in user
exports.getUserAlbums = async (req, res) => {
  try {
    const albums = await Album.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('savedBy', 'name avatar');
    res.json(albums);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user albums' });
  }
};

// Get all albums (for feed)
exports.getAllAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('savedBy', 'name avatar')
      .limit(50); // Limit to prevent overwhelming response
    res.json(albums);
  } catch (err) {
    console.error('Error fetching albums:', err);
    res.status(500).json({ message: 'Error fetching albums' });
  }
};

// Like/Unlike album
exports.toggleLike = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    const userId = req.userId;
    const likeIndex = album.likes.indexOf(userId);
    if (likeIndex > -1) {
      album.likes.splice(likeIndex, 1);
    } else {
      album.likes.push(userId);
    }
    await album.save();
    res.json({ likes: album.likes, liked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

// Share album
exports.shareAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    const userId = req.userId;
    const shareIndex = album.shares.indexOf(userId);
    if (shareIndex > -1) {
      album.shares.splice(shareIndex, 1);
    } else {
      album.shares.push(userId);
    }
    await album.save();
    res.json({ shares: album.shares, shared: shareIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing album', error: err.message });
  }
};

// Add comment to album
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    album.comments.push({
      user: req.userId,
      text: text.trim()
    });
    await album.save();
    await album.populate('comments.user', 'name avatar');
    const newComment = album.comments[album.comments.length - 1];
    res.json({ comment: newComment, message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Delete comment from album
exports.deleteComment = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    const commentId = req.params.commentId;
    const comment = album.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.user) !== String(req.userId) && String(album.user) !== String(req.userId)) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }
    album.comments.pull(commentId);
    await album.save();
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Save/Unsave album
exports.toggleSave = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    
    const userId = req.userId;
    const saveIndex = album.savedBy.indexOf(userId);
    
    if (saveIndex > -1) {
      // Unsave
      album.savedBy.splice(saveIndex, 1);
    } else {
      // Save
      album.savedBy.push(userId);
    }
    
    await album.save();
    res.json({ savedBy: album.savedBy, saved: saveIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

// Get saved albums for user
exports.getSavedAlbums = async (req, res) => {
  try {
    const albums = await Album.find({ savedBy: req.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    res.json(albums);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved albums' });
  }
};

// Get albums with videos (for watch page)
exports.getAlbumsWithVideos = async (req, res) => {
  try {
    const albums = await Album.find({
      'media.type': 'video'
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name avatar username')
    .populate('comments.user', 'name avatar')
    .limit(50);
    
    // Transform albums to video format for watch page
    const videos = albums.flatMap(album => 
      album.media
        .filter(media => media.type === 'video')
        .map(media => ({
          _id: `${album._id}_${media._id}`,
          user: {
            name: album.user.name,
            username: album.user.username || album.user.name,
            avatar: album.user.avatar,
            verified: false,
            isPro: false,
            userId: album.user._id
          },
          title: album.name,
          description: `From album: ${album.name}`,
          videoUrl: media.url,
          videoThumbnail: media.url,
          isYoutube: false,
          isSponsored: false,
          category: 'album',
          likes: album.likes,
          views: [], // Albums don't have views tracking
          comments: album.comments.map(comment => ({
            _id: comment._id,
            user: {
              name: comment.user.name,
              avatar: comment.user.avatar,
              userId: comment.user._id
            },
            text: comment.text,
            createdAt: comment.createdAt
          })),
          shares: album.shares,
          savedBy: album.savedBy,
          createdAt: album.createdAt
        }))
    );
    
    res.json(videos);
  } catch (err) {
    console.error('Error fetching albums with videos:', err);
    res.status(500).json({ message: 'Error fetching albums with videos' });
  }
};

// Get the most engaged album (highest likes + comments + views)
exports.getMostEngagedAlbum = async (req, res) => {
  try {
    const albums = await Album.find();
    if (!albums.length) return res.json(null);
    // Calculate engagement score for each album
    const albumsWithScore = albums.map(album => ({
      album,
      score: (album.likes?.length || 0) + (album.comments?.length || 0) + (album.views?.length || 0)
    }));
    // Find the album with the highest score
    const mostEngaged = albumsWithScore.reduce((max, curr) => curr.score > max.score ? curr : max, albumsWithScore[0]);
    res.json(mostEngaged.album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
