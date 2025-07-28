const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all addresses for the authenticated user
router.get('/', getUserAddresses);

// Add new address
router.post('/', addAddress);

// Update address
router.put('/:addressId', updateAddress);

// Delete address
router.delete('/:addressId', deleteAddress);

// Set default address
router.patch('/:addressId/default', setDefaultAddress);

module.exports = router; 