const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

// Upload profile picture
router.post('/profile-picture', authMiddleware, uploadController.uploadSingle, uploadController.uploadProfilePicture);

// Upload cover photo
router.post('/cover-photo', authMiddleware, uploadController.uploadSingle, uploadController.uploadCoverPhoto);

// Upload post media
router.post('/post-media', authMiddleware, uploadController.uploadArray, uploadController.uploadPostMedia);

// Upload album media
router.post('/album-media', authMiddleware, uploadController.uploadArray, uploadController.uploadAlbumMedia);

// Delete file
router.delete('/file/:filename', authMiddleware, uploadController.deleteFile);

// Get file info
router.get('/file/:filename', authMiddleware, uploadController.getFileInfo);

module.exports = router; 