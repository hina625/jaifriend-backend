const { upload } = require('../config/cloudinary');

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Update user's profile photo in database
    const User = require('../models/user');
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old profile photo from Cloudinary if it exists and is not default
    if (user.avatar && !user.avatar.includes('avatars/') && user.avatar !== '/avatars/1.png.png') {
      try {
        const { deleteFromCloudinary } = require('../config/cloudinary');
        // Extract public ID from Cloudinary URL
        const publicId = user.avatar.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.log('Could not delete old profile photo:', error.message);
      }
    }
    
    // Update user's avatar with Cloudinary URL
    const photoUrl = req.file.path; // Cloudinary provides secure URL directly
    console.log('📸 Profile photo upload debug:');
    console.log('  - Original file path:', req.file.path);
    console.log('  - File object:', req.file);
    console.log('  - User ID:', currentUserId);
    console.log('  - Old avatar:', user.avatar);
    console.log('  - New avatar URL:', photoUrl);
    
    user.avatar = photoUrl;
    await user.save();
    
    console.log('  - Avatar saved to database:', user.avatar);

    res.json({
      message: 'Profile photo uploaded successfully',
      avatar: user.avatar,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Update user's cover photo in database
    const User = require('../models/user');
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old cover photo from Cloudinary if it exists
    if (user.coverPhoto && user.coverPhoto !== '/covers/default-cover.jpg') {
      try {
        const { deleteFromCloudinary } = require('../config/cloudinary');
        // Extract public ID from Cloudinary URL
        const publicId = user.coverPhoto.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.log('Could not delete old cover photo:', error.message);
      }
    }
    
    // Update user's cover photo with Cloudinary URL
    const coverUrl = req.file.path; // Cloudinary provides secure URL directly
    console.log('🖼️ Cover photo upload debug:');
    console.log('  - Original file path:', req.file.path);
    console.log('  - File object:', req.file);
    console.log('  - User ID:', currentUserId);
    console.log('  - Old cover photo:', user.coverPhoto);
    console.log('  - New cover photo URL:', coverUrl);
    
    user.coverPhoto = coverUrl;
    await user.save();
    
    console.log('  - Cover photo saved to database:', user.coverPhoto);

    res.json({
      message: 'Cover photo uploaded successfully',
      coverPhoto: user.coverPhoto,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload post media
exports.uploadPostMedia = async (req, res) => {
  try {
    console.log('📤 uploadPostMedia called');
    console.log('📤 Request body:', req.body);
    console.log('📤 Request file:', req.file);
    console.log('📤 Request files:', req.files);
    
    // Handle both single file and multiple files
    let files = [];
    
    if (req.file) {
      // Single file upload
      console.log('📤 Single file upload detected');
      files = [req.file];
    } else if (req.files && req.files.length > 0) {
      // Multiple files upload
      console.log('📤 Multiple files upload detected:', req.files.length);
      files = req.files;
    } else {
      console.log('❌ No files found in request');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('📁 Processing uploaded files:', files.length);
    console.log('📁 File details:', files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      path: f.path,
      url: f.url,
      mimetype: f.mimetype,
      // Log all available properties for debugging
      allProps: Object.keys(f),
      // Log the actual file object for debugging
      fileObject: f
    })));

    const uploadedFiles = files.map(file => {
      // When using Cloudinary storage, file.path contains the Cloudinary URL
      // When using local storage, file.path contains the local file path
      const { isCloudinaryConfigured } = require('../config/cloudinary');
      
      let fileUrl = file.path; // Default to file.path
      let filePath = file.path;
      
      // For Cloudinary, file.path contains the full URL
      // For local storage, file.path contains the relative path
      if (isCloudinaryConfigured) {
        // Cloudinary provides the full URL in file.path
        fileUrl = file.path;
        filePath = file.path;
      } else {
        // Local storage - construct full URL
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://jaifriend-backend-production.up.railway.app'
          : 'http://localhost:5000';
        fileUrl = `${baseUrl}/${file.path}`;
        filePath = file.path;
      }
      
      return {
        filename: file.filename,
        originalname: file.originalname,
        path: filePath,
        url: fileUrl, // This is what the frontend expects
        size: file.size,
        mimetype: file.mimetype,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video'
      };
    });

    console.log('📁 Processed files:', uploadedFiles.map(f => ({
      filename: f.filename,
      url: f.url,
      type: f.type
    })));

    const response = {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      media: uploadedFiles // Add media array for frontend compatibility
    };

    console.log('📤 Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error uploading post media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete uploaded file
exports.deleteFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Try to delete from Cloudinary first
    try {
      const { deleteFromCloudinary } = require('../config/cloudinary');
      // Extract public ID from Cloudinary URL
      const publicId = filePath.split('/').pop().split('.')[0];
      await deleteFromCloudinary(publicId);
      res.json({ message: 'File deleted from Cloudinary successfully' });
    } catch (cloudinaryError) {
      console.log('Could not delete from Cloudinary, trying local file:', cloudinaryError.message);
      
      // Fallback to local file deletion
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        res.json({ message: 'Local file deleted successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const { filePath } = req.params;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Decode the filePath in case it contains encoded characters
    const decodedFilePath = decodeURIComponent(filePath);
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '..', decodedFilePath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      res.json({
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadProfilePhoto: exports.uploadProfilePhoto,
  uploadCoverPhoto: exports.uploadCoverPhoto,
  uploadPostMedia: exports.uploadPostMedia,
  deleteFile: exports.deleteFile,
  getFileInfo: exports.getFileInfo
}; 