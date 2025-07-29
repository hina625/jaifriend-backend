const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Create different folders for different types of uploads
    if (file.fieldname === 'profilePhoto') {
      uploadPath += 'profile-photos/';
    } else if (file.fieldname === 'coverPhoto') {
      uploadPath += 'cover-photos/';
    } else if (file.fieldname === 'postMedia') {
      uploadPath += 'post-media/';
    } else {
      uploadPath += 'general/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

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

      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Update user's profile photo in database
      const User = require('../models/user');
      const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
      
      // Delete old profile photo if it exists and is not default
      if (user.avatar && !user.avatar.includes('avatars/') && user.avatar !== '/avatars/1.png.png') {
        const oldPhotoPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      
      // Update user's avatar with new photo path
      const photoUrl = '/' + req.file.path.replace(/\\/g, '/');
      user.avatar = photoUrl;
      await user.save();

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

      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Update user's cover photo in database
      const User = require('../models/user');
      const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
      
      // Delete old cover photo if it exists
      if (user.coverPhoto && user.coverPhoto !== '/covers/default-cover.jpg') {
        const oldCoverPath = path.join(__dirname, '..', user.coverPhoto);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
      
      // Update user's cover photo with new photo path
      const coverUrl = '/' + req.file.path.replace(/\\/g, '/');
      user.coverPhoto = coverUrl;
      await user.save();

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
        path: '/' + file.path.replace(/\\/g, '/'),
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
    
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
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