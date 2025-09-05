const ProfileSettings = require('../models/profileSettings');
const User = require('../models/user');

// Get user's profile settings
const getProfileSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let profileSettings = await ProfileSettings.findOne({ userId });

    // If no settings exist, create default settings
    if (!profileSettings) {
      profileSettings = new ProfileSettings({
        userId,
        firstName: '',
        lastName: '',
        aboutMe: '',
        location: '',
        website: '',
        relationship: 'None',
        school: '',
        schoolCompleted: false,
        workingAt: '',
        companyWebsite: ''
      });

      await profileSettings.save();
    }

    res.json({
      success: true,
      data: profileSettings
    });

  } catch (error) {
    console.error('Error fetching profile settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile settings'
    });
  }
};

// Update user's profile settings
const updateProfileSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Validate settings
    const validSettings = [
      'firstName',
      'lastName',
      'aboutMe',
      'location',
      'website',
      'relationship',
      'school',
      'schoolCompleted',
      'workingAt',
      'companyWebsite'
    ];

    const filteredSettings = {};
    validSettings.forEach(setting => {
      if (settings[setting] !== undefined) {
        filteredSettings[setting] = settings[setting];
      }
    });

    // Add lastUpdated timestamp
    filteredSettings.lastUpdated = new Date();

    // Update or create profile settings
    const profileSettings = await ProfileSettings.findOneAndUpdate(
      { userId },
      filteredSettings,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    // Also update the main user document with basic info
    const userUpdateData = {};
    if (filteredSettings.firstName) userUpdateData.firstName = filteredSettings.firstName;
    if (filteredSettings.lastName) userUpdateData.lastName = filteredSettings.lastName;
    if (filteredSettings.aboutMe) userUpdateData.bio = filteredSettings.aboutMe;
    if (filteredSettings.location) userUpdateData.location = filteredSettings.location;
    if (filteredSettings.website) userUpdateData.website = filteredSettings.website;

    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdateData);
    }

    res.json({
      success: true,
      message: 'Profile settings updated successfully',
      data: profileSettings
    });

  } catch (error) {
    console.error('Error updating profile settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile settings'
    });
  }
};

// Get profile settings summary
const getProfileSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileSettings = await ProfileSettings.findOne({ userId });
    
    if (!profileSettings) {
      return res.status(404).json({
        success: false,
        message: 'Profile settings not found'
      });
    }

    // Create a summary of profile settings
    const summary = {
      fullName: `${profileSettings.firstName} ${profileSettings.lastName}`.trim(),
      aboutMe: profileSettings.aboutMe,
      location: profileSettings.location,
      website: profileSettings.website,
      relationship: profileSettings.relationship,
      education: {
        school: profileSettings.school,
        completed: profileSettings.schoolCompleted
      },
      work: {
        company: profileSettings.workingAt,
        website: profileSettings.companyWebsite
      },
      lastUpdated: profileSettings.lastUpdated
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching profile summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile summary'
    });
  }
};

// Reset profile settings to default
const resetProfileSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultSettings = {
      firstName: '',
      lastName: '',
      aboutMe: '',
      location: '',
      website: '',
      relationship: 'None',
      school: '',
      schoolCompleted: false,
      workingAt: '',
      companyWebsite: '',
      lastUpdated: new Date()
    };

    const profileSettings = await ProfileSettings.findOneAndUpdate(
      { userId },
      defaultSettings,
      { 
        new: true, 
        upsert: true 
      }
    );

    res.json({
      success: true,
      message: 'Profile settings reset to default',
      data: profileSettings
    });

  } catch (error) {
    console.error('Error resetting profile settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset profile settings'
    });
  }
};

// Get profile completion percentage
const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileSettings = await ProfileSettings.findOne({ userId });
    
    if (!profileSettings) {
      return res.status(404).json({
        success: false,
        message: 'Profile settings not found'
      });
    }

    // Calculate completion percentage
    const fields = [
      'firstName',
      'lastName',
      'aboutMe',
      'location',
      'website',
      'relationship',
      'school',
      'workingAt'
    ];

    let completedFields = 0;
    fields.forEach(field => {
      if (profileSettings[field] && profileSettings[field].toString().trim() !== '') {
        completedFields++;
      }
    });

    const completionPercentage = Math.round((completedFields / fields.length) * 100);

    const completion = {
      percentage: completionPercentage,
      completedFields,
      totalFields: fields.length,
      missingFields: fields.filter(field => !profileSettings[field] || profileSettings[field].toString().trim() === ''),
      lastUpdated: profileSettings.lastUpdated
    };

    res.json({
      success: true,
      data: completion
    });

  } catch (error) {
    console.error('Error fetching profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile completion'
    });
  }
};

module.exports = {
  getProfileSettings,
  updateProfileSettings,
  getProfileSummary,
  resetProfileSettings,
  getProfileCompletion
}; 