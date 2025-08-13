const { upload } = require('../config/cloudinary');

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const uploadSingle = upload.single('profilePhoto');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
    }

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
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
  try {
    const uploadSingle = upload.single('coverPhoto');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
    }

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
    });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload post media
exports.uploadPostMedia = async (req, res) => {
  try {
    const uploadMultiple = upload.array('postMedia', 10); // Max 10 files
    
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

      const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
        originalname: file.originalname,
        path: file.path, // Cloudinary provides secure URL directly
        size: file.size,
      mimetype: file.mimetype,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video'
    }));

    res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });
    });
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
  upload,
  uploadProfilePhoto: exports.uploadProfilePhoto,
  uploadCoverPhoto: exports.uploadCoverPhoto,
  uploadPostMedia: exports.uploadPostMedia,
  deleteFile: exports.deleteFile,
  getFileInfo: exports.getFileInfo
}; 