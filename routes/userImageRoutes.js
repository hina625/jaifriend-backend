const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getUserImages,
  updateUserImages,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover
} = require('../controllers/userImageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user images
router.get('/', getUserImages);

// Update user images (for base64 data)
router.put('/', updateUserImages);

// Upload avatar image
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Upload cover image
router.post('/cover', upload.single('cover'), uploadCover);

// Delete avatar
router.delete('/avatar', deleteAvatar);

// Delete cover
router.delete('/cover', deleteCover);

module.exports = router; 