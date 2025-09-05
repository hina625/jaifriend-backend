const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const auth = require('../middlewares/authMiddleware');

// Public routes (no authentication required)
router.get('/ip', locationController.getLocationFromIP);
router.get('/current', locationController.getCurrentLocation);
router.get('/nearby', locationController.getNearbyPlaces);

// Protected routes (authentication required)
router.post('/search', auth, locationController.searchLocations);
router.get('/history', auth, locationController.getLocationHistory);
router.post('/favorite', auth, locationController.addFavoriteLocation);
router.delete('/favorite/:locationId', auth, locationController.removeFavoriteLocation);
router.get('/favorites', auth, locationController.getFavoriteLocations);

module.exports = router;
