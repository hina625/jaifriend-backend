const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const auth = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// Create album (multiple photos or photo URLs)
router.post('/', auth, upload.array('photos', 20), albumController.createAlbum);

// Get all albums (for feed)
router.get('/', albumController.getAllAlbums);

// Get albums for logged-in user
router.get('/user', auth, albumController.getUserAlbums);

// Edit album (update name, add more photos)
router.put('/:id', auth, upload.array('photos', 20), albumController.editAlbum);

// Delete album
router.delete('/:id', auth, albumController.deleteAlbum);

// Like/Unlike album
router.post('/:id/like', auth, albumController.toggleLike);

// Add reaction to album
router.post('/:id/reaction', auth, albumController.addReaction);

// Share album
router.post('/:id/share', auth, albumController.shareAlbum);

// Add comment to album
router.post('/:id/comment', auth, albumController.addComment);

// Delete comment from album
router.delete('/:id/comment/:commentId', auth, albumController.deleteComment);

// Save/Unsave album
router.post('/:id/save', auth, albumController.toggleSave);

// Add view to album
router.post('/:id/view', auth, albumController.addView);

// Get saved albums for user
router.get('/saved', auth, albumController.getSavedAlbums);

// Get albums with videos (for watch page)
router.get('/videos', albumController.getAlbumsWithVideos);

router.get('/most-engaged', albumController.getMostEngagedAlbum);

// Migrate existing albums to Cloudinary (admin only)
router.post('/migrate-to-cloudinary', auth, albumController.migrateToCloudinary);

module.exports = router;
