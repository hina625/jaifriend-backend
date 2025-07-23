const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get logged-in user's profile
router.get('/me', authMiddleware, profileController.getMyProfile);

// Get user profile by ID
router.get('/user/:id', authMiddleware, profileController.getUserProfile);

// Update user profile
router.put('/update', authMiddleware, profileController.updateProfile);

// Update profile picture
router.put('/avatar', authMiddleware, profileController.updateProfilePicture);

// Update cover photo
router.put('/cover', authMiddleware, profileController.updateCoverPhoto);

// Follow/Unfollow user
router.post('/follow', authMiddleware, profileController.followUser);

// Get user's posts (logged-in user)
router.get('/posts', authMiddleware, profileController.getUserPosts);

// Get specific user's posts
router.get('/posts/:id', authMiddleware, profileController.getUserPosts);

// Update online status
router.put('/online-status', authMiddleware, profileController.updateOnlineStatus);

// Get profile completion status
router.get('/completion/status', authMiddleware, profileController.getProfileCompletion);

// Get user's feed
router.get('/feed', authMiddleware, profileController.getFeed);
// Like/unlike a post
router.post('/like', authMiddleware, profileController.likePost);
// Join/leave a group
router.post('/group', authMiddleware, profileController.joinGroup);
// Get user's groups
router.get('/groups', authMiddleware, profileController.getGroups);
// Get user's liked posts
router.get('/liked-posts', authMiddleware, profileController.getLikedPosts);

module.exports = router; 