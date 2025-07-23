const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all posts for dashboard feed
router.get('/', postController.getAllPosts);

router.post('/', auth, upload.array('media', 10), postController.createPost); // Support multiple files
router.post('/single', auth, upload.single('media'), postController.createPost); // Backward compatibility
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.toggleLike);
router.post('/:id/save', auth, postController.toggleSave);

// Add comment to a post
router.post('/:id/comment', auth, postController.addComment);

// Get all saved posts for the logged-in user
router.get('/saved', auth, postController.getSavedPosts);

// Edit a post
router.put('/:id', auth, upload.array('media', 10), postController.editPost);

// Delete a comment from a post
router.delete('/:postId/comment/:commentId', auth, postController.deleteComment);

// Share post
router.post('/:id/share', auth, postController.sharePost);

// Get posts with media (for feed)
router.get('/media', postController.getPostsWithMedia);

// Get posts with videos (for watch page)
router.get('/videos', postController.getPostsWithVideos);

const { getPopularPosts, getMostEngagedPost } = require('../controllers/postController');
router.get('/popular', getPopularPosts);
router.get('/most-engaged', getMostEngagedPost);

module.exports = router;
