const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for profile picture' });
    }

    // Update user's avatar
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for cover photo' });
    }

    // Update user's cover photo
    const coverPhotoPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { coverPhoto: coverPhotoPath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Cover photo uploaded successfully',
      coverPhoto: user.coverPhoto
    });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload post media
exports.uploadPostMedia = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate file types
    const validFiles = req.files.filter(file => 
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
    );

    if (validFiles.length === 0) {
      return res.status(400).json({ error: 'No valid files uploaded' });
    }

    // Process uploaded files
    const mediaFiles = validFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video'
    }));

    res.json({
      message: 'Media uploaded successfully',
      files: mediaFiles
    });
  } catch (error) {
    console.error('Error uploading post media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload album media
exports.uploadAlbumMedia = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate file types
    const validFiles = req.files.filter(file => 
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
    );

    if (validFiles.length === 0) {
      return res.status(400).json({ error: 'No valid files uploaded' });
    }

    // Process uploaded files
    const mediaFiles = validFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video'
    }));

    res.json({
      message: 'Album media uploaded successfully',
      files: mediaFiles
    });
  } catch (error) {
    console.error('Error uploading album media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete uploaded file
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      path: `/uploads/${filename}`
    };

    res.json(fileInfo);
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export multer configurations
exports.upload = upload;
exports.uploadSingle = upload.single('file');
exports.uploadArray = upload.array('files', 10); // Max 10 files
exports.uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'media', maxCount: 10 }
]); 