const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all search routes
router.use(authMiddleware);

// Quick search for navbar (returns top results)
router.get('/quick', searchController.quickSearch);

// Unified search across all content types
router.get('/', searchController.unifiedSearch);

module.exports = router;
