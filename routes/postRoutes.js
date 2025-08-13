const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/authMiddleware');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

// Get all posts (for dashboard feed)
router.get('/', postController.getAllPosts);

// Get posts by current user
router.get('/user', auth, postController.getUserPosts);

// Get posts by specific user ID
router.get('/by-user', auth, postController.getPostsByUserId);

// Get posts for any user profile (public access)
router.get('/profile/:userId', postController.getPostsByUserId);

// Get all saved posts for the logged-in user (must be before /:id routes)
router.get('/saved', auth, postController.getSavedPosts);

// Get posts with media (for feed) (must be before /:id routes)
router.get('/media', postController.getPostsWithMedia);

// Get posts with videos (for watch page) (must be before /:id routes)
router.get('/videos', postController.getPostsWithVideos);

// Get popular posts (must be before /:id routes)
router.get('/popular', postController.getPopularPosts);

// Get most engaged post (must be before /:id routes)
router.get('/most-engaged', postController.getMostEngagedPost);

router.post('/', auth, upload.array('media', 10), postController.createPost); // Support multiple files
router.post('/single', auth, upload.single('media'), postController.createPost); // Backward compatibility

// Comment routes (must come before /:id routes to avoid conflicts)
router.post('/:id/comment', auth, postController.addComment);
router.put('/:id/comment/:commentId', auth, postController.editComment);
router.delete('/:id/comment/:commentId', auth, postController.deleteComment);

// Post action routes
router.post('/:id/like', auth, postController.toggleLike);
router.post('/:id/reaction', auth, postController.addReaction);
router.post('/:id/save', auth, postController.toggleSave);
router.get('/:id/saved-status', auth, postController.checkPostSaved);
router.post('/:id/toggle-comments', auth, postController.toggleComments);
router.post('/:id/pin', auth, postController.pinPost);
router.post('/:id/boost', auth, postController.boostPost);
router.post('/:id/share', auth, postController.sharePost);
router.post('/:id/view', auth, postController.addView);
router.post('/:id/review', auth, postController.addReview);

// Post CRUD routes
router.delete('/:id', auth, postController.deletePost);
router.put('/:id', auth, upload.array('media', 10), postController.editPost);

module.exports = router;
