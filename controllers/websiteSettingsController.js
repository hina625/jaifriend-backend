const WebsiteSettings = require('../models/websiteSettings');

// Get all website settings
const getWebsiteSettings = async (req, res) => {
  try {
    const settings = await WebsiteSettings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting website settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get website settings',
      error: error.message
    });
  }
};

// Update website settings
const updateWebsiteSettings = async (req, res) => {
  try {
    const updateData = req.body;
    
    // Get current settings or create new ones
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
    }
    
    // Update all fields that are provided
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
          // Handle nested objects
          Object.keys(updateData[key]).forEach(nestedKey => {
            if (updateData[key][nestedKey] !== undefined) {
              if (typeof updateData[key][nestedKey] === 'object' && !Array.isArray(updateData[key][nestedKey])) {
                // Handle deeply nested objects
                Object.keys(updateData[key][nestedKey]).forEach(deepKey => {
                  if (updateData[key][nestedKey][deepKey] !== undefined) {
                    settings[key][nestedKey][deepKey] = updateData[key][nestedKey][deepKey];
                  }
                });
              } else {
                settings[key][nestedKey] = updateData[key][nestedKey];
              }
            }
          });
        } else {
          settings[key] = updateData[key];
        }
      }
    });
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Website settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating website settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update website settings',
      error: error.message
    });
  }
};

// Update specific feature
const updateFeature = async (req, res) => {
  try {
    const { feature, enabled } = req.body;
    
    if (!feature || typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Feature name and enabled status are required'
      });
    }
    
    const settings = await WebsiteSettings.getSettings();
    
    // Check if feature exists in the schema
    if (!settings.features.hasOwnProperty(feature)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature name'
      });
    }
    
    settings.features[feature] = enabled;
    await settings.save();
    
    res.json({
      success: true,
      message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: { feature, enabled }
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feature',
      error: error.message
    });
  }
};

// Update general setting
const updateGeneralSetting = async (req, res) => {
  try {
    const { setting, value, enabled } = req.body;
    
    if (!setting) {
      return res.status(400).json({
        success: false,
        message: 'Setting name is required'
      });
    }
    
    const settings = await WebsiteSettings.getSettings();
    
    // Check if setting exists in the general schema
    if (!settings.general.hasOwnProperty(setting)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid setting name'
      });
    }
    
    // Update the setting
    if (enabled !== undefined) {
      settings.general[setting] = enabled;
    } else if (value !== undefined) {
      settings.general[setting] = value;
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: `Setting ${setting} updated successfully`,
      data: { setting, value: settings.general[setting] }
    });
  } catch (error) {
    console.error('Error updating general setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general setting',
      error: error.message
    });
  }
};

// Update API key
const updateApiKey = async (req, res) => {
  try {
    const { service, key, enabled } = req.body;
    
    if (!service || !key) {
      return res.status(400).json({
        success: false,
        message: 'Service name and API key are required'
      });
    }
    
    const settings = await WebsiteSettings.getSettings();
    
    // Check if service exists in the schema
    if (!settings.apiKeys.hasOwnProperty(service)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service name'
      });
    }
    
    settings.apiKeys[service].key = key;
    if (enabled !== undefined) {
      settings.apiKeys[service].enabled = enabled;
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: `API key for ${service} updated successfully`,
      data: { service, key, enabled: settings.apiKeys[service].enabled }
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: error.message
    });
  }
};

// Toggle maintenance mode
const toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;
    
    const settings = await WebsiteSettings.getSettings();
    
    settings.maintenance.enabled = enabled;
    if (message) {
      settings.maintenance.message = message;
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        enabled: settings.maintenance.enabled,
        message: settings.maintenance.message
      }
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle maintenance mode',
      error: error.message
    });
  }
};

// Get website mode status
const getWebsiteMode = async (req, res) => {
  try {
    const settings = await WebsiteSettings.getSettings();
    
    res.json({
      success: true,
      data: {
        mode: settings.websiteMode,
        maintenance: settings.maintenance,
        features: settings.features
      }
    });
  } catch (error) {
    console.error('Error getting website mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get website mode',
      error: error.message
    });
  }
};

// Reset settings to defaults
const resetToDefaults = async (req, res) => {
  try {
    const settings = await WebsiteSettings.getSettings();
    
    // Reset to default values
    const defaultSettings = new WebsiteSettings();
    Object.keys(defaultSettings.toObject()).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        settings[key] = defaultSettings[key];
      }
    });
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings reset to defaults successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};

module.exports = {
  getWebsiteSettings,
  updateWebsiteSettings,
  updateFeature,
  updateGeneralSetting,
  updateApiKey,
  toggleMaintenanceMode,
  getWebsiteMode,
  resetToDefaults
}; 