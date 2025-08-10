const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

// Import verification controller
const {
  submitVerification,
  getVerificationStatus,
  getAllVerifications,
  reviewVerification,
  deleteVerification
} = require('../controllers/verificationController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Submit verification request
router.post('/', upload.fields([
  { name: 'passportDocument', maxCount: 1 },
  { name: 'personalPicture', maxCount: 1 }
]), submitVerification);

// Get user's verification status
router.get('/status', getVerificationStatus);

// Get all verification requests (admin only)
router.get('/all', getAllVerifications);

// Review verification request (admin only)
router.put('/:verificationId/review', reviewVerification);

// Delete verification request
router.delete('/:verificationId', deleteVerification);

module.exports = router; 