const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getSocialLinks,
  updateSocialLinks,
  deleteSocialLinks
} = require('../controllers/socialLinksController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user's social links
router.get('/', getSocialLinks);

// Update user's social links
router.put('/', updateSocialLinks);

// Delete user's social links
router.delete('/', deleteSocialLinks);

module.exports = router; 