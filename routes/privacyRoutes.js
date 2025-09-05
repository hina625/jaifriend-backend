const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getPrivacySettings,
  updatePrivacySettings,
  getPrivacySummary,
  resetPrivacySettings,
  getPrivacyStats
} = require('../controllers/privacyController');

// All routes require authentication
router.use(authMiddleware);

// Get user's privacy settings
router.get('/settings', getPrivacySettings);

// Update user's privacy settings
router.put('/settings', updatePrivacySettings);

// Get privacy settings summary
router.get('/summary', getPrivacySummary);

// Reset privacy settings to default
router.post('/reset', resetPrivacySettings);

// Get privacy settings statistics
router.get('/stats', getPrivacyStats);

module.exports = router; 