const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getUserImages,
  updateUserImages,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  cleanupLocalhostUrls
} = require('../controllers/userImageController');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

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

// Cleanup localhost URLs (admin only)
router.post('/cleanup-localhost', cleanupLocalhostUrls);

module.exports = router; 