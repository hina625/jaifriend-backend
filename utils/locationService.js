const axios = require('axios');

class LocationService {
  constructor() {
    // IP-based geolocation services
    this.ipApiUrl = 'http://ip-api.com/json';
    this.ipInfoUrl = 'https://ipinfo.io/json';
    this.ipApiKey = process.env.IPINFO_TOKEN; // Optional: for ipinfo.io if you want higher rate limits
  }

  /**
   * Get location from IP address
   * @param {string} ip - IP address (optional, will use request IP if not provided)
   * @returns {Promise<Object>} Location data with coordinates and details
   */
  async getLocationFromIP(ip = null) {
    try {
      // Try ip-api.com first (free, no API key required)
      try {
        const response = await axios.get(this.ipApiUrl, {
          timeout: 5000,
          params: ip ? { query: ip } : {}
        });

        if (response.data && response.data.status === 'success') {
          const data = response.data;
          return {
            name: data.city || 'Unknown City',
            address: this.formatAddress(data),
            coordinates: {
              latitude: data.lat,
              longitude: data.lon
            },
            placeId: null, // Not available from IP geolocation
            category: 'location',
            country: data.country,
            state: data.regionName,
            city: data.city,
            postalCode: data.zip,
            timezone: data.timezone,
            isp: data.isp,
            ip: data.query,
            source: 'ip-api.com'
          };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('ip-api.com failed, trying ipinfo.io:', error.message);
        }
      }

      // Fallback to ipinfo.io
      try {
        const headers = {};
        if (this.ipApiKey) {
          headers['Authorization'] = `Bearer ${this.ipApiKey}`;
        }

        const response = await axios.get(this.ipInfoUrl, {
          timeout: 5000,
          headers,
          params: ip ? { ip } : {}
        });

        if (response.data) {
          const data = response.data;
          const [lat, lng] = (data.loc || '').split(',').map(Number);
          
          return {
            name: data.city || 'Unknown City',
            address: this.formatAddressFromIpInfo(data),
            coordinates: {
              latitude: lat || 0,
              longitude: lng || 0
            },
            placeId: null,
            category: 'location',
            country: data.country,
            state: data.region,
            city: data.city,
            postalCode: data.postal,
            timezone: data.timezone,
            isp: data.org,
            ip: data.ip,
            source: 'ipinfo.io'
          };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('ipinfo.io also failed:', error.message);
        }
      }

      throw new Error('Unable to get location from IP address');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting location from IP:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get nearby places using IP location
   * @param {string} ip - IP address
   * @param {number} radius - Search radius in meters (default: 5000)
   * @param {string} type - Place type filter (optional)
   * @returns {Promise<Array>} Array of nearby places
   */
  async getNearbyPlacesFromIP(ip = null, radius = 5000, type = null) {
    try {
      const locationData = await this.getLocationFromIP(ip);
      
      // For now, return basic nearby information
      // In a full implementation, you could use OpenStreetMap or other free services
      const nearbyPlaces = [
        {
          name: `${locationData.city} City Center`,
          address: locationData.address,
          coordinates: locationData.coordinates,
          category: 'city_center',
          distance: 0
        },
        {
          name: `${locationData.city} Main Street`,
          address: `Main Street, ${locationData.city}, ${locationData.country}`,
          coordinates: {
            latitude: locationData.coordinates.latitude + 0.001,
            longitude: locationData.coordinates.longitude + 0.001
          },
          category: 'street',
          distance: 0.1
        }
      ];

      return nearbyPlaces;
    } catch (error) {
      console.error('❌ Error getting nearby places from IP:', error.message);
      throw error;
    }
  }

  /**
   * Format address from ip-api.com data
   */
  formatAddress(data) {
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.regionName) parts.push(data.regionName);
    if (data.country) parts.push(data.country);
    if (data.zip) parts.push(data.zip);
    
    return parts.join(', ');
  }

  /**
   * Format address from ipinfo.io data
   */
  formatAddressFromIpInfo(data) {
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country) parts.push(data.country);
    if (data.postal) parts.push(data.postal);
    
    return parts.join(', ');
  }

  /**
   * Calculate distance between two coordinates in kilometers
   * @param {number} lat1 - First latitude
   * @param {number} lng1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lng2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Validate coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if coordinates are valid
   */
  validateCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIP(req) {
    // Check various headers for real IP (when behind proxy)
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.headers['x-client-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.ip || 
               '127.0.0.1';
    
    // If x-forwarded-for contains multiple IPs, take the first one
    return ip.split(',')[0].trim();
  }
}

module.exports = new LocationService();
