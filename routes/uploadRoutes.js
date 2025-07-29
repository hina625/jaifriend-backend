const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

// Upload profile photo
router.post('/profile-photo', authMiddleware, uploadController.uploadProfilePhoto);

// Upload cover photo
router.post('/cover-photo', authMiddleware, uploadController.uploadCoverPhoto);

// Upload post media
router.post('/post-media', authMiddleware, uploadController.uploadPostMedia);

// Delete file
router.delete('/file', authMiddleware, uploadController.deleteFile);

// Get file info
router.get('/file/:filePath', authMiddleware, uploadController.getFileInfo);

module.exports = router; 