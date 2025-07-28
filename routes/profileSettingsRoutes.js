const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getProfileSettings,
  updateProfileSettings,
  getProfileSummary,
  resetProfileSettings,
  getProfileCompletion
} = require('../controllers/profileSettingsController');

// All routes require authentication
router.use(authMiddleware);

// Get user's profile settings
router.get('/settings', getProfileSettings);

// Update user's profile settings
router.put('/settings', updateProfileSettings);

// Get profile settings summary
router.get('/summary', getProfileSummary);

// Reset profile settings to default
router.post('/reset', resetProfileSettings);

// Get profile completion percentage
router.get('/completion', getProfileCompletion);

module.exports = router; 