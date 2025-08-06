const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getWebsiteSettings,
  updateWebsiteSettings,
  updateFeature,
  updateGeneralSetting,
  updateApiKey,
  toggleMaintenanceMode,
  getWebsiteMode,
  resetToDefaults
} = require('../controllers/websiteSettingsController');

// Get all website settings (admin only)
router.get('/', authMiddleware, getWebsiteSettings);

// Update website settings (admin only)
router.put('/', authMiddleware, updateWebsiteSettings);

// Update specific feature (admin only)
router.put('/feature', authMiddleware, updateFeature);

// Update general setting (admin only)
router.put('/general', authMiddleware, updateGeneralSetting);

// Update API key (admin only)
router.put('/api-key', authMiddleware, updateApiKey);

// Toggle maintenance mode (admin only)
router.put('/maintenance', authMiddleware, toggleMaintenanceMode);

// Get website mode status (public - no auth required)
router.get('/mode', getWebsiteMode);

// Reset settings to defaults (admin only)
router.post('/reset', authMiddleware, resetToDefaults);

module.exports = router; 