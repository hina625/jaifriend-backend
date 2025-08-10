const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Get all videos (for watch page)
router.get('/', videoController.getVideos);

// Get videos by category (must come before parameterized route)
router.get('/category/:category', videoController.getVideosByCategory);

// Get video by ID (parameterized route comes last)
router.get('/:id', videoController.getVideoById);

// Create video (with file upload or URL)
router.post('/', auth, upload.single('video'), videoController.createVideo);

// Like/Unlike video
router.post('/:id/like', auth, videoController.toggleLike);

// Share video
router.post('/:id/share', auth, videoController.shareVideo);

// Save/Unsave video
router.post('/:id/save', auth, videoController.toggleSave);

// Add comment to video
router.post('/:id/comment', auth, videoController.addComment);

// Delete comment from video
router.delete('/:id/comment/:commentId', auth, videoController.deleteComment);

// Delete video
router.delete('/:id', auth, videoController.deleteVideo);

module.exports = router; 