const locationService = require('../utils/locationService');
const Post = require('../models/post');
const User = require('../models/user');

/**
 * Get location from client's IP address
 * @route GET /api/location/ip
 */
exports.getLocationFromIP = async (req, res) => {
  try {
    console.log(`🔍 IP location request from: ${req.ip}`);
    
    const clientIP = locationService.getClientIP(req);
    console.log(`📍 Client IP detected: ${clientIP}`);

    const locationData = await locationService.getLocationFromIP(clientIP);
    
    res.json({
      success: true,
      message: 'Location retrieved from IP successfully',
      data: locationData
    });

  } catch (error) {
    console.error('❌ Error in getLocationFromIP:', error);
    
    res.status(500).json({
      message: 'Error retrieving location from IP',
      error: error.message
    });
  }
};

/**
 * Get nearby places for client's IP location
 * @route GET /api/location/nearby
 * @query {number} radius - Search radius in meters (default: 5000)
 * @query {string} type - Place type filter (optional)
 */
exports.getNearbyPlaces = async (req, res) => {
  try {
    const { radius = 5000, type } = req.query;
    const clientIP = locationService.getClientIP(req);
    
    console.log(`🔍 Nearby places request from IP: ${clientIP}, radius: ${radius}m`);

    const places = await locationService.getNearbyPlacesFromIP(
      clientIP, 
      parseInt(radius), 
      type
    );
    
    res.json({
      success: true,
      message: 'Nearby places retrieved successfully',
      data: {
        clientIP,
        radius: parseInt(radius),
        type: type || 'all',
        count: places.length,
        places: places
      }
    });

  } catch (error) {
    console.error('❌ Error in getNearbyPlaces:', error);
    
    res.status(500).json({
      message: 'Error retrieving nearby places',
      error: error.message
    });
  }
};

/**
 * Get current user's location from IP
 * @route GET /api/location/current
 */
exports.getCurrentLocation = async (req, res) => {
  try {
    const clientIP = locationService.getClientIP(req);
    console.log(`🔍 Current location request from IP: ${clientIP}`);

    const locationData = await locationService.getLocationFromIP(clientIP);
    
    res.json({
      success: true,
      message: 'Current location retrieved successfully',
      data: locationData
    });

  } catch (error) {
    console.error('❌ Error in getCurrentLocation:', error);
    
    res.status(500).json({
      message: 'Error retrieving current location',
      error: error.message
    });
  }
};

/**
 * Search for locations with autocomplete suggestions
 * @route POST /api/location/search
 * @body {string} query - Search query
 * @body {number} lat - Current latitude (optional, for context)
 * @body {number} lng - Current longitude (optional, for context)
 */
exports.searchLocations = async (req, res) => {
  try {
    const { query, lat, lng } = req.body;
    const userId = req.userId;
    const clientIP = locationService.getClientIP(req);
    
    console.log(`🔍 Location search request from user ${userId} (IP: ${clientIP}): ${query}`);

    // For now, we'll return the current IP location as a suggestion
    // In a full implementation, you could integrate with OpenStreetMap or other free services
    try {
      const currentLocation = await locationService.getLocationFromIP(clientIP);
      
      res.json({
        success: true,
        message: 'Location search completed',
        data: {
          query,
          currentLocation,
          suggestions: [currentLocation],
          timestamp: new Date()
        }
      });
    } catch (error) {
      res.json({
        success: true,
        message: 'Location search completed',
        data: {
          query,
          currentLocation: null,
          suggestions: [],
          timestamp: new Date()
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in searchLocations:', error);
    
    res.status(500).json({
      message: 'Error searching locations',
      error: error.message
    });
  }
};

/**
 * Get location search history for a user
 * @route GET /api/location/history
 */
exports.getLocationHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    // This would typically query a location history collection
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Location history retrieved',
      data: {
        userId,
        history: [],
        message: 'Location history feature coming soon'
      }
    });

  } catch (error) {
    console.error('❌ Error in getLocationHistory:', error);
    res.status(500).json({
      message: 'Error retrieving location history',
      error: error.message
    });
  }
};

/**
 * Add a location to user's favorites
 * @route POST /api/location/favorite
 * @body {Object} location - Location data to favorite
 */
exports.addFavoriteLocation = async (req, res) => {
  try {
    const userId = req.userId;
    const { location } = req.body;
    
    if (!location || !location.name) {
      return res.status(400).json({
        message: 'Location data is required',
        error: 'Please provide valid location information'
      });
    }

    // This would typically save to a user favorites collection
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Location added to favorites',
      data: {
        userId,
        location,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error in addFavoriteLocation:', error);
    res.status(500).json({
      message: 'Error adding location to favorites',
      error: error.message
    });
  }
};

/**
 * Remove a location from user's favorites
 * @route DELETE /api/location/favorite/:locationId
 * @param {string} locationId - ID of the location to remove
 */
exports.removeFavoriteLocation = async (req, res) => {
  try {
    const userId = req.userId;
    const { locationId } = req.params;
    
    if (!locationId) {
      return res.status(400).json({
        message: 'Location ID is required',
        error: 'Please provide a valid location ID'
      });
    }

    // This would typically remove from a user favorites collection
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Location removed from favorites',
      data: {
        userId,
        locationId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error in removeFavoriteLocation:', error);
    res.status(500).json({
      message: 'Error removing location from favorites',
      error: error.message
    });
  }
};

/**
 * Get user's favorite locations
 * @route GET /api/location/favorites
 */
exports.getFavoriteLocations = async (req, res) => {
  try {
    const userId = req.userId;
    
    // This would typically query a user favorites collection
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Favorite locations retrieved',
      data: {
        userId,
        favorites: [],
        message: 'Favorite locations feature coming soon'
      }
    });

  } catch (error) {
    console.error('❌ Error in getFavoriteLocations:', error);
    res.status(500).json({
      message: 'Error retrieving favorite locations',
      error: error.message
    });
  }
};
