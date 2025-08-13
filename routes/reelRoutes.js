const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const auth = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  console.log('🏥 Reels health check called');
  res.json({ status: 'OK', message: 'Reels API is working', timestamp: new Date().toISOString() });
});
router.get('/', reelController.getReels);
router.get('/trending', reelController.getTrendingReels);
router.get('/hashtag/:hashtag', reelController.getReelsByHashtag);
router.get('/user/:userId', reelController.getUserReels);
router.get('/:id', reelController.getReelById);

// Protected routes (authentication required)
router.post('/', auth, upload.single('video'), reelController.createReel);
router.put('/:id', auth, reelController.updateReel);
router.delete('/:id', auth, reelController.deleteReel);

// Engagement routes
router.post('/:id/like', auth, reelController.toggleLike);
router.post('/:id/share', auth, reelController.shareReel);
router.post('/:id/save', auth, reelController.toggleSave);
router.post('/:id/comment', auth, reelController.addComment);
router.delete('/:id/comment/:commentId', auth, reelController.deleteComment);

module.exports = router;
