const PrivacySettings = require('../models/privacySettings');
const User = require('../models/user');

// Get user's privacy settings
const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let privacySettings = await PrivacySettings.findOne({ userId });

    // If no settings exist, create default settings
    if (!privacySettings) {
      privacySettings = new PrivacySettings({
        userId,
        status: 'Online',
        whoCanFollowMe: 'Everyone',
        whoCanMessageMe: 'Everyone',
        whoCanSeeMyFriends: 'Everyone',
        whoCanPostOnMyTimeline: 'People I Follow',
        whoCanSeeMyBirthday: 'Everyone',
        confirmRequestWhenSomeoneFollowsYou: 'No',
        showMyActivities: 'Yes',
        shareMyLocationWithPublic: 'Yes',
        allowSearchEnginesToIndex: 'Yes'
      });

      await privacySettings.save();
    }

    res.json({
      success: true,
      data: privacySettings
    });

  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy settings'
    });
  }
};

// Update user's privacy settings
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Validate settings
    const validSettings = [
      'status',
      'whoCanFollowMe',
      'whoCanMessageMe',
      'whoCanSeeMyFriends',
      'whoCanPostOnMyTimeline',
      'whoCanSeeMyBirthday',
      'confirmRequestWhenSomeoneFollowsYou',
      'showMyActivities',
      'shareMyLocationWithPublic',
      'allowSearchEnginesToIndex'
    ];

    const filteredSettings = {};
    validSettings.forEach(setting => {
      if (settings[setting] !== undefined) {
        filteredSettings[setting] = settings[setting];
      }
    });

    // Add lastUpdated timestamp
    filteredSettings.lastUpdated = new Date();

    // Update or create privacy settings
    const privacySettings = await PrivacySettings.findOneAndUpdate(
      { userId },
      filteredSettings,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: privacySettings
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
};

// Get privacy settings summary
const getPrivacySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const privacySettings = await PrivacySettings.findOne({ userId });
    
    if (!privacySettings) {
      return res.status(404).json({
        success: false,
        message: 'Privacy settings not found'
      });
    }

    // Create a summary of privacy settings
    const summary = {
      profileVisibility: privacySettings.whoCanFollowMe,
      messagingPrivacy: privacySettings.whoCanMessageMe,
      friendsVisibility: privacySettings.whoCanSeeMyFriends,
      timelinePrivacy: privacySettings.whoCanPostOnMyTimeline,
      birthdayPrivacy: privacySettings.whoCanSeeMyBirthday,
      followConfirmation: privacySettings.confirmRequestWhenSomeoneFollowsYou,
      activityVisibility: privacySettings.showMyActivities,
      locationSharing: privacySettings.shareMyLocationWithPublic,
      searchEngineIndexing: privacySettings.allowSearchEnginesToIndex,
      lastUpdated: privacySettings.lastUpdated
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching privacy summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy summary'
    });
  }
};

// Reset privacy settings to default
const resetPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultSettings = {
      status: 'Online',
      whoCanFollowMe: 'Everyone',
      whoCanMessageMe: 'Everyone',
      whoCanSeeMyFriends: 'Everyone',
      whoCanPostOnMyTimeline: 'People I Follow',
      whoCanSeeMyBirthday: 'Everyone',
      confirmRequestWhenSomeoneFollowsYou: 'No',
      showMyActivities: 'Yes',
      shareMyLocationWithPublic: 'Yes',
      allowSearchEnginesToIndex: 'Yes',
      lastUpdated: new Date()
    };

    const privacySettings = await PrivacySettings.findOneAndUpdate(
      { userId },
      defaultSettings,
      { 
        new: true, 
        upsert: true 
      }
    );

    res.json({
      success: true,
      message: 'Privacy settings reset to default',
      data: privacySettings
    });

  } catch (error) {
    console.error('Error resetting privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset privacy settings'
    });
  }
};

// Get privacy settings statistics
const getPrivacyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const privacySettings = await PrivacySettings.findOne({ userId });
    
    if (!privacySettings) {
      return res.status(404).json({
        success: false,
        message: 'Privacy settings not found'
      });
    }

    // Calculate privacy level (0-100, where 100 is most private)
    let privacyLevel = 0;
    
    if (privacySettings.whoCanFollowMe === 'No one') privacyLevel += 20;
    else if (privacySettings.whoCanFollowMe === 'Friends only') privacyLevel += 10;
    
    if (privacySettings.whoCanMessageMe === 'No one') privacyLevel += 20;
    else if (privacySettings.whoCanMessageMe === 'Friends only') privacyLevel += 10;
    
    if (privacySettings.whoCanSeeMyFriends === 'Only me') privacyLevel += 15;
    else if (privacySettings.whoCanSeeMyFriends === 'Friends only') privacyLevel += 7;
    
    if (privacySettings.whoCanPostOnMyTimeline === 'Only me') privacyLevel += 15;
    else if (privacySettings.whoCanPostOnMyTimeline === 'Friends only') privacyLevel += 7;
    
    if (privacySettings.whoCanSeeMyBirthday === 'Only me') privacyLevel += 10;
    else if (privacySettings.whoCanSeeMyBirthday === 'Friends only') privacyLevel += 5;
    
    if (privacySettings.confirmRequestWhenSomeoneFollowsYou === 'Yes') privacyLevel += 5;
    if (privacySettings.showMyActivities === 'No') privacyLevel += 5;
    if (privacySettings.shareMyLocationWithPublic === 'No') privacyLevel += 5;
    if (privacySettings.allowSearchEnginesToIndex === 'No') privacyLevel += 5;

    const stats = {
      privacyLevel,
      privacyLevelText: privacyLevel >= 80 ? 'Very Private' : 
                       privacyLevel >= 60 ? 'Private' : 
                       privacyLevel >= 40 ? 'Moderate' : 
                       privacyLevel >= 20 ? 'Open' : 'Very Open',
      lastUpdated: privacySettings.lastUpdated,
      settingsCount: Object.keys(privacySettings.toObject()).length - 3 // Exclude _id, userId, timestamps
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching privacy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy statistics'
    });
  }
};

module.exports = {
  getPrivacySettings,
  updatePrivacySettings,
  getPrivacySummary,
  resetPrivacySettings,
  getPrivacyStats
}; 