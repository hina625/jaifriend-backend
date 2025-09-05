const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const auth = require('../middlewares/authMiddleware');

// File upload routes
router.post('/upload', auth, fileController.uploadFile);
router.post('/upload-multiple', auth, fileController.uploadMultipleFiles);

// File management routes
router.get('/:fileId', fileController.getFile);
router.post('/:fileId/download', fileController.downloadFile);
router.delete('/:fileId', auth, fileController.deleteFile);

// File query routes
router.get('/post/:postId', fileController.getFilesByPost);
router.get('/user/files', auth, fileController.getFilesByUser);

module.exports = router;
