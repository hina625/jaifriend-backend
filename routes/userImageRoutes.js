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
  cleanupLocalhostUrls,
  migrateToCloudinary,
  getUserImagesById
} = require('../controllers/userImageController');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user images
router.get('/', getUserImages);

// Get user images by user ID (for viewing other users' profiles)
router.get('/:userId', getUserImagesById);

// Update user images (for base64 data)
router.put('/', updateUserImages);

// Upload avatar image
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Upload cover image
router.post('/cover', upload.single('cover'), uploadCover);

// Delete avatar image
router.delete('/avatar', deleteAvatar);

// Delete cover image
router.delete('/cover', deleteCover);

// Cleanup localhost URLs (admin only)
router.post('/cleanup-localhost', cleanupLocalhostUrls);

// Migrate to Cloudinary (admin only)
router.post('/migrate-to-cloudinary', migrateToCloudinary);

module.exports = router; 