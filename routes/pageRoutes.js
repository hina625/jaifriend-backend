const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const auth = require('../middlewares/authMiddleware');

// Create a new page (requires authentication)
router.post('/', auth, pageController.createPage);

// Get all pages (public)
router.get('/', pageController.getPages);

// Get pages by user (requires authentication)
router.get('/user', auth, pageController.getUserPages);

// Get page by ID (public)
router.get('/:id', pageController.getPageById);

// Like/Unlike page (requires authentication)
router.post('/:id/like', auth, pageController.likePage);

module.exports = router; 