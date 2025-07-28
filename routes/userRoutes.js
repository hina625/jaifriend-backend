const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Search users - must come before parameterized routes
router.get('/search', authMiddleware, userController.searchUsers);

// Get suggested users to follow - must come before parameterized routes
router.get('/suggested', authMiddleware, userController.getSuggestedUsers);

// Get user by ID
router.get('/:id', authMiddleware, userController.getUserById);

// Follow/Unfollow user
router.post('/:userId/follow', authMiddleware, userController.followUser);

// Block/Unblock user
router.post('/:userId/block', authMiddleware, userController.blockUser);

// Get user's posts
router.get('/:userId/posts', authMiddleware, userController.getUserPosts);

// Get user's albums
router.get('/:userId/albums', authMiddleware, userController.getUserAlbums);

// Get user's photos
router.get('/:userId/photos', authMiddleware, userController.getUserPhotos);

// Get user's videos
router.get('/:userId/videos', authMiddleware, userController.getUserVideos);

// Get user's friends (mutual followers)
router.get('/:userId/friends', authMiddleware, userController.getUserFriends);

// Get user's followers
router.get('/:userId/followers', authMiddleware, userController.getUserFollowers);

// Get user's following
router.get('/:userId/following', authMiddleware, userController.getUserFollowing);

module.exports = router; 