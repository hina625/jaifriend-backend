const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  changePassword,
  getPasswordHistory,
  getPasswordStats,
  validatePasswordStrength
} = require('../controllers/passwordController');

// All routes require authentication
router.use(authMiddleware);

// Change password
router.post('/change', changePassword);

// Get password change history
router.get('/history', getPasswordHistory);

// Get password security stats
router.get('/stats', getPasswordStats);

// Validate password strength
router.post('/validate', validatePasswordStrength);

module.exports = router; 