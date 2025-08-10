const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getInvitationStats,
  generateInvitation,
  getUserInvitations,
  getInvitationById,
  useInvitationCode,
  deleteInvitation
} = require('../controllers/invitationController');

// All routes require authentication except useInvitationCode
router.use(authMiddleware);

// Get user's invitation statistics
router.get('/stats', getInvitationStats);

// Generate new invitation link
router.post('/generate', generateInvitation);

// Get user's invitation history
router.get('/', getUserInvitations);

// Get specific invitation by ID
router.get('/:invitationId', getInvitationById);

// Delete invitation
router.delete('/:invitationId', deleteInvitation);

// Use invitation code (for registration - no auth required)
router.post('/use', useInvitationCode);

module.exports = router; 