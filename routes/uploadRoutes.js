const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// Upload profile photo
router.post('/profile-photo', authMiddleware, upload.single('avatar'), uploadController.uploadProfilePhoto);

// Upload cover photo
router.post('/cover-photo', authMiddleware, upload.single('cover'), uploadController.uploadCoverPhoto);

// Upload post media
router.post('/post-media', authMiddleware, upload.single('postMedia'), uploadController.uploadPostMedia);

// General upload endpoint (for any media type) - handle both single and multiple files
router.post('/', authMiddleware, upload.single('postMedia'), uploadController.uploadPostMedia);
router.post('/multiple', authMiddleware, upload.array('postMedia', 10), uploadController.uploadPostMedia);

// Delete file
router.delete('/file', authMiddleware, uploadController.deleteFile);

// Get file info
router.get('/file/:filePath', authMiddleware, uploadController.getFileInfo);

module.exports = router; 