const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const auth = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// Create a new story (with media upload)
router.post('/', auth, upload.single('media'), storyController.createStory);

// Get all active stories for feed
router.get('/feed', auth, storyController.getFeedStories);

// Get stories by specific user
router.get('/user/:userId', auth, storyController.getUserStories);

// View a story (increment view count)
router.post('/:storyId/view', auth, storyController.viewStory);

// React to a story
router.post('/:storyId/react', auth, storyController.reactToStory);

// Reply to a story
router.post('/:storyId/reply', auth, storyController.replyToStory);

// Delete a story
router.delete('/:storyId', auth, storyController.deleteStory);

// Get story statistics
router.get('/:storyId/stats', auth, storyController.getStoryStats);

module.exports = router;
