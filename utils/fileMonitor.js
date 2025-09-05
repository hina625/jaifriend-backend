const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const Album = require('../models/album');

class FileMonitor {
  constructor() {
    this.uploadsPath = path.join(__dirname, '..', 'uploads');
    this.isWatching = false;
  }

  // Start monitoring the uploads folder
  startWatching() {
    if (this.isWatching) {
      return;
    }

    try {
      // Ensure uploads directory exists
      if (!fs.existsSync(this.uploadsPath)) {
        fs.mkdirSync(this.uploadsPath, { recursive: true });
      }
      
      // Watch for file deletions
      fs.watch(this.uploadsPath, { recursive: true }, (eventType, filename) => {
        if (eventType === 'unlink' && filename) {
          this.handleFileDeleted(filename);
        }
      });

      this.isWatching = true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error starting file monitor:', error);
      }
    }
  }

  // Handle when a file is deleted from uploads folder
  async handleFileDeleted(filename) {
    try {
      // Check if this file is referenced in any posts
      await this.cleanupPosts(filename);
      
      // Check if this file is referenced in any albums
      await this.cleanupAlbums(filename);
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error handling file deletion:', error);
      }
    }
  }

  // Remove posts that reference the deleted file
  async cleanupPosts(filename) {
    try {
      const fileUrl = `/uploads/${filename}`;
      
      // Find posts that contain this file in their media
      const postsToUpdate = await Post.find({
        'media.url': fileUrl
      });

      if (postsToUpdate.length > 0) {
        for (const post of postsToUpdate) {
          // Remove the deleted file from media array
          post.media = post.media.filter(media => media.url !== fileUrl);
          
          // If no media left and post has no content, delete the entire post
          if (post.media.length === 0 && (!post.content || post.content.trim() === '')) {
            await Post.findByIdAndDelete(post._id);
          } else {
            // Update the post with remaining media
            await post.save();
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error cleaning up posts:', error);
      }
    }
  }

  // Remove albums that reference the deleted file
  async cleanupAlbums(filename) {
    try {
      const fileUrl = `/uploads/${filename}`;
      
      // Find albums that contain this file in their media
      const albumsToUpdate = await Album.find({
        'media.url': fileUrl
      });

      if (albumsToUpdate.length > 0) {
        console.log(`📸 Found ${albumsToUpdate.length} albums referencing deleted file: ${filename}`);
        
        for (const album of albumsToUpdate) {
          // Remove the deleted file from media array
          album.media = album.media.filter(media => media.url !== fileUrl);
          
          // If no media left, delete the entire album
          if (album.media.length === 0) {
            await Album.findByIdAndDelete(album._id);
          } else {
            // Update the album with remaining media
            await album.save();
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error cleaning up albums:', error);
      }
    }
  }

  // Manual cleanup - scan all files and remove orphaned database entries
  async manualCleanup() {
    try {
      // Get all files in uploads directory
      const files = fs.readdirSync(this.uploadsPath);
      const fileUrls = files.map(file => `/uploads/${file}`);
      
      // Clean up posts with non-existent files
      const posts = await Post.find({ 'media.url': { $regex: /^\/uploads\// } });
      let postsCleaned = 0;
      
      for (const post of posts) {
        const originalMediaCount = post.media.length;
        post.media = post.media.filter(media => {
          if (media.url && media.url.startsWith('/uploads/')) {
            const filename = media.url.replace('/uploads/', '');
            const filePath = path.join(this.uploadsPath, filename);
            return fs.existsSync(filePath);
          }
          return true; // Keep external URLs
        });
        
        if (post.media.length !== originalMediaCount) {
          if (post.media.length === 0 && (!post.content || post.content.trim() === '')) {
            await Post.findByIdAndDelete(post._id);
          } else {
            await post.save();
          }
          postsCleaned++;
        }
      }
      
      // Clean up albums with non-existent files
      const albums = await Album.find({ 'media.url': { $regex: /^\/uploads\// } });
      let albumsCleaned = 0;
      
      for (const album of albums) {
        const originalMediaCount = album.media.length;
        album.media = album.media.filter(media => {
          if (media.url && media.url.startsWith('/uploads/')) {
            const filename = media.url.replace('/uploads/', '');
            const filePath = path.join(this.uploadsPath, filename);
            return fs.existsSync(filePath);
          }
          return true; // Keep external URLs
        });
        
        if (album.media.length !== originalMediaCount) {
          if (album.media.length === 0) {
            await Album.findByIdAndDelete(album._id);
          } else {
            await album.save();
          }
          albumsCleaned++;
        }
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during manual cleanup:', error);
      }
    }
  }

  // Stop monitoring
  stopWatching() {
    if (!this.isWatching) {
      return;
    }
    
    // Note: fs.watch doesn't have a direct way to stop watching
    // This is more of a flag to indicate the monitor should stop
    this.isWatching = false;
  }

  // Get status
  getStatus() {
    return {
      isWatching: this.isWatching,
      uploadsPath: this.uploadsPath,
      uploadsExists: fs.existsSync(this.uploadsPath)
    };
  }
}

module.exports = new FileMonitor(); 