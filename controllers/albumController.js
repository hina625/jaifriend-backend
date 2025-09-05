const Album = require('../models/album');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const { isCloudinaryConfigured, deleteFromCloudinary } = require('../config/cloudinary');

// Create a new album with multiple photos/videos or URLs
exports.createAlbum = async (req, res) => {
  try {
    const { name } = req.body;
    let media = [];

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        
        // Use Cloudinary URL if available, otherwise fallback to local
        let url;
        if (isCloudinaryConfigured && file.path) {
          // Cloudinary file - use the secure URL
          url = file.path;
        } else {
          // Local file - construct local URL
          url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        }
        
        return {
          url,
          type: isVideo ? 'video' : 'image',
          mimetype: file.mimetype,
          filename: file.filename,
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
        const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url) || url.includes('video');
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
      user: req.userId, // Use req.userId as set by the auth middleware
      name,
      media
    });
    await album.save();
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    res.status(201).json(album);
  } catch (err) {
    console.error('Error creating album:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      userId: req.userId,
      name: req.body.name,
      mediaCount: media.length
    });
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
        
        // Use Cloudinary URL if available, otherwise fallback to local
        let url;
        if (isCloudinaryConfigured && file.path) {
          // Cloudinary file - use the secure URL
          url = file.path;
        } else {
          // Local file - construct local URL
          url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        }
        
        return {
          url,
          type: isVideo ? 'video' : 'image',
          mimetype: file.mimetype,
          filename: file.filename,
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
        const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url) || url.includes('video');
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

    // Clean up media files
    if (album.media && album.media.length > 0) {
      for (const media of album.media) {
        if (media.url) {
          if (isCloudinaryConfigured && media.url.includes('cloudinary.com')) {
            // Delete from Cloudinary
            try {
              const publicId = media.url.split('/').pop().split('.')[0];
              await deleteFromCloudinary(publicId);
            } catch (error) {
              console.error('Error deleting from Cloudinary:', error);
            }
          } else if (media.url.includes('/uploads/')) {
            // Delete local file
            try {
              const filePath = path.join(__dirname, '..', media.url.replace(`${req.protocol}://${req.get('host')}`, ''));
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (error) {
              console.error('Error deleting local file:', error);
            }
          }
        }
      }
    }
    
    await album.deleteOne();
    res.json({ 
      message: 'Album deleted'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting album', error: err.message });
  }
};

// Migrate existing albums from local storage to Cloudinary
exports.migrateToCloudinary = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(400).json({ message: 'Cloudinary not configured' });
    }

    const albums = await Album.find({
      'media.url': { $regex: /\/uploads\// }
    });

    let migratedCount = 0;
    for (const album of albums) {
      for (const media of album.media) {
        if (media.url && media.url.includes('/uploads/')) {
          try {
            // Here you would implement the actual migration logic
            // For now, we'll just mark it as needing migration
            media.needsMigration = true;
            migratedCount++;
          } catch (error) {
            console.error('Error migrating media:', error);
          }
        }
      }
      await album.save();
    }

    res.json({ 
      message: `Migration completed. ${migratedCount} media items marked for migration.`,
      migratedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Error during migration', error: err.message });
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
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    await album.populate('comments.user', 'name avatar');
    await album.populate('savedBy', 'name avatar');
    await album.populate('reactions.user', 'name avatar');
    
    res.json({ 
      album: album,
      likes: album.likes, 
      liked: likeIndex === -1 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

// Share album
exports.shareAlbum = async (req, res) => {
  try {
    const { message, shareTo, shareOnTimeline, shareToPage, shareToGroup } = req.body;
    const userId = req.userId;

    console.log('Album share request:', {
      albumId: req.params.id,
      userId,
      message,
      shareTo,
      shareOnTimeline,
      shareToPage,
      shareToGroup
    });

    const originalAlbum = await Album.findById(req.params.id).populate('user', 'name avatar');
    if (!originalAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Get current user info
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sharedPosts = [];
    let shareCount = 0;

    // Share on timeline as a post
    if (shareOnTimeline) {
      try {
        const Post = require('../models/post');
        const timelinePost = new Post({
          content: `<pre class="whitespace-pre-wrap break-words font-sans">${message || `Shared album: ${originalAlbum.name}`}</pre>`,
          isShared: true,
          originalAlbum: originalAlbum._id,
          user: {
            name: currentUser.name || currentUser.username,
            avatar: currentUser.avatar || '/avatars/1.png.png',
            userId: userId
          },
          userId: userId,
          privacy: shareTo === 'public' ? 'public' : 'friends',
          shareMessage: message,
          sharedFrom: {
            albumId: originalAlbum._id,
            userId: originalAlbum.user._id,
            userName: originalAlbum.user?.name || 'Unknown User',
            userAvatar: originalAlbum.user?.avatar || '/avatars/1.png.png',
            albumName: originalAlbum.name,
            albumMedia: originalAlbum.media
          },
          // Add album media to the shared post for preview
          media: originalAlbum.media.slice(0, 3).map(media => ({
            url: media.url,
            type: media.type,
            thumbnail: media.url,
            originalName: `Album Media`,
            size: 0,
            mimetype: media.type === 'video' ? 'video/*' : 'image/*',
            uploadedAt: new Date()
          }))
        });
        
        await timelinePost.save();
        sharedPosts.push(timelinePost);
        shareCount++;
        console.log('Album shared to timeline as post:', timelinePost._id);
      } catch (postError) {
        console.error('Error creating timeline post:', postError);
        // Continue with other sharing options even if timeline sharing fails
      }
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

    // Add user to original album's shares array if not already there
    if (!originalAlbum.shares.includes(userId)) {
      originalAlbum.shares.push(userId);
      await originalAlbum.save();
    }

    // Create notification for original album owner
    if (originalAlbum.user._id.toString() !== userId.toString()) { // Fixed: use user._id instead of userId
      try {
        const { createNotification } = require('./notificationController');
        
        await createNotification({
          userId: originalAlbum.user._id, // Fixed: use user._id instead of userId
          type: 'share',
          title: 'Album Shared',
          message: `${currentUser.name} shared your album "${originalAlbum.name}"`,
          relatedUserId: userId,
          relatedPostId: originalAlbum._id
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue even if notification creation fails
      }
    }
    
    // Populate user info for response
    await originalAlbum.populate('user', 'name avatar');
    await originalAlbum.populate('comments.user', 'name avatar');
    await originalAlbum.populate('savedBy', 'name avatar');
    await originalAlbum.populate('reactions.user', 'name avatar');
    
    console.log('Album share completed successfully:', {
      albumId: originalAlbum._id,
      sharesCount: originalAlbum.shares.length,
      sharedPostsCount: sharedPosts.length
    });
    
    res.json({ 
      album: originalAlbum,
      sharedPosts,
      shares: originalAlbum.shares, 
      shared: true,
      shareCount,
      message: `Album shared successfully to ${shareCount} location${shareCount !== 1 ? 's' : ''}`
    });
  } catch (err) {
    console.error('Share album error:', err);
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
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    await album.populate('comments.user', 'name avatar');
    await album.populate('savedBy', 'name avatar');
    await album.populate('reactions.user', 'name avatar');
    
    const newComment = album.comments[album.comments.length - 1];
    res.json({ 
      album: album,
      comment: newComment, 
      message: 'Comment added successfully' 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Delete comment from album
exports.deleteComment = async (req, res) => {
  try {
    const { id: albumId, commentId } = req.params;
    const userId = req.userId;

    console.log('🗑️ Deleting album comment:', { albumId, commentId, userId });

    const album = await Album.findById(albumId);
    if (!album) {
      console.log('❌ Album not found:', albumId);
      return res.status(404).json({ message: 'Album not found' });
    }

    const comment = album.comments.id(commentId);
    if (!comment) {
      console.log('❌ Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('🔍 Comment user ID:', comment.user.toString());
    console.log('🔍 Current user ID:', userId);
    console.log('🔍 Album user ID:', album.user.toString());

    // Check if user is comment author or album owner
    if (String(comment.user) !== String(userId) && String(album.user) !== String(userId)) {
      console.log('❌ Unauthorized to delete comment');
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    album.comments.pull(commentId);
    await album.save();

    console.log('✅ Comment removed, saving album...');

    // Populate the album with user info before sending response
    await album.populate('user', 'name avatar username');
    await album.populate('comments.user', 'name avatar');
    await album.populate('likes', 'name avatar');
    await album.populate('savedBy', 'name avatar');
    await album.populate('reactions.user', 'name avatar');

    console.log('✅ Album populated, sending response');

    res.json({ 
      message: 'Comment deleted successfully',
      album: album
    });
  } catch (err) {
    console.error('❌ Error deleting album comment:', err);
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Save/Unsave album
exports.toggleSave = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    
    const userId = req.userId;
    console.log('🎯 Toggle save request for album:', req.params.id, 'by user:', userId);
    console.log('📋 Current savedBy:', album.savedBy);
    
    const saveIndex = album.savedBy.indexOf(userId);
    console.log('🔍 Save index:', saveIndex);
    
    if (saveIndex > -1) {
      // Unsave
      album.savedBy.splice(saveIndex, 1);
      console.log('❌ Removed user from savedBy');
    } else {
      // Save
      album.savedBy.push(userId);
      console.log('✅ Added user to savedBy');
    }
    
    await album.save();
    console.log('💾 Album saved, new savedBy:', album.savedBy);
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    await album.populate('comments.user', 'name avatar');
    await album.populate('savedBy', 'name avatar');
    await album.populate('reactions.user', 'name avatar');
    
    res.json({ 
      album: album,
      savedBy: album.savedBy, 
      saved: saveIndex === -1 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

// Get saved albums for user
exports.getSavedAlbums = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('🔍 Fetching saved albums for user:', userId);
    
    const albums = await Album.find({ savedBy: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    
    console.log('✅ Found', albums.length, 'saved albums for user:', userId);
    res.json(albums);
  } catch (err) {
    console.error('❌ Error fetching saved albums:', err);
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

// Add view to album
exports.addView = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    
    const userId = req.userId;
    
    // Only add view if user hasn't viewed this album before
    if (!album.views.includes(userId)) {
      album.views.push(userId);
      await album.save();
    }
    
    res.json({ views: album.views, viewCount: album.views.length });
  } catch (err) {
    res.status(500).json({ message: 'Error adding view', error: err.message });
  }
};

// Add reaction to album
exports.addReaction = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const albumId = req.params.id;
    const userId = req.userId;

    if (!reactionType || !['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Check if user already has a reaction
    const existingReactionIndex = album.reactions.findIndex(
      reaction => reaction.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = album.reactions[existingReactionIndex];
      
      // If same reaction type, remove it (toggle off)
      if (existingReaction.type === reactionType) {
        album.reactions.splice(existingReactionIndex, 1);
      } else {
        // If different reaction type, update it
        existingReaction.type = reactionType;
      }
    } else {
      // Add new reaction
      album.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date()
      });
    }

    await album.save();
    
    // Populate user info for response
    await album.populate('user', 'name avatar');
    await album.populate('reactions.user', 'name avatar');

    res.json({
      message: 'Reaction updated successfully',
      album: album,
      reactionCount: album.reactions.length
    });
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ message: 'Error adding reaction', error: err.message });
  }
};
