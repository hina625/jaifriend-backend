const Notification = require('../models/notification');
const User = require('../models/user');

// Get user's notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's notification settings from user document
    const user = await User.findById(userId).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return default settings if none exist
    const defaultSettings = {
      someonelikedMyPosts: true,
      someoneCommentedOnMyPosts: true,
      someoneSharedOnMyPosts: true,
      someoneFollowedMe: true,
      someoneLikedMyPages: true,
      someoneVisitedMyProfile: true,
      someoneMentionedMe: true,
      someoneJoinedMyGroups: true,
      someoneAcceptedMyFriendRequest: true,
      someonePostedOnMyTimeline: true
    };

    const settings = user.notificationSettings || defaultSettings;

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
};

// Update user's notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Validate settings
    const validSettings = [
      'someonelikedMyPosts',
      'someoneCommentedOnMyPosts',
      'someoneSharedOnMyPosts',
      'someoneFollowedMe',
      'someoneLikedMyPages',
      'someoneVisitedMyProfile',
      'someoneMentionedMe',
      'someoneJoinedMyGroups',
      'someoneAcceptedMyFriendRequest',
      'someonePostedOnMyTimeline'
    ];

    const filteredSettings = {};
    validSettings.forEach(setting => {
      if (typeof settings[setting] === 'boolean') {
        filteredSettings[setting] = settings[setting];
      }
    });

    // Update user's notification settings
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationSettings: filteredSettings },
      { new: true }
    ).select('notificationSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.notificationSettings
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
};

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedUserId', 'name username avatar')
      .populate('relatedPostId', 'content')
      .populate('relatedGroupId', 'name')
      .populate('relatedPageId', 'name')
      .select('-__v');

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    // Add frontend URLs to notifications
    const frontendUrl = req.frontendUrl || 'http://localhost:3000';
    const notificationsWithUrls = notifications.map(notification => {
      let actionUrl = null;
      
      // Generate action URLs based on notification type
      switch (notification.type) {
        case 'post_like':
        case 'post_comment':
        case 'post_share':
          actionUrl = notification.relatedPostId ? 
            `${frontendUrl}/dashboard/posts/${notification.relatedPostId._id}` : null;
          break;
        case 'profile_visit':
        case 'profile_follow':
          actionUrl = notification.relatedUserId ? 
            `${frontendUrl}/dashboard/profile/${notification.relatedUserId._id}` : null;
          break;
        case 'group_join':
          actionUrl = notification.relatedGroupId ? 
            `${frontendUrl}/dashboard/groups/${notification.relatedGroupId._id}` : null;
          break;
        case 'page_like':
          actionUrl = notification.relatedPageId ? 
            `${frontendUrl}/dashboard/pages/${notification.relatedPageId._id}` : null;
          break;
        default:
          actionUrl = `${frontendUrl}/dashboard`;
      }

      return {
        ...notification.toObject(),
        actionUrl
      };
    });

    res.json({
      success: true,
      data: {
        notifications: notificationsWithUrls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId
      },
      {
        isRead: true
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      {
        userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalCount, unreadCount, todayCount] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
      Notification.countDocuments({
        userId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Get count by type
    const typeStats = await Notification.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalCount,
        unreadCount,
        todayCount,
        typeStats
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};

// Create notification (utility function for other controllers)
const createNotification = async (data) => {
  try {
    console.log('🔔 Creating notification:', data);
    
    // Check if user has notification settings enabled for this type
    const shouldCreateNotification = await checkNotificationSettings(data.userId, data.type);
    console.log(`🔔 Should create notification for user ${data.userId}, type ${data.type}:`, shouldCreateNotification);
    
    if (!shouldCreateNotification) {
      console.log(`Notification skipped for user ${data.userId}, type ${data.type} - settings disabled`);
      return null;
    }

    const notification = new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedUserId: data.relatedUserId,
      relatedPostId: data.relatedPostId,
      relatedGroupId: data.relatedGroupId,
      relatedPageId: data.relatedPageId
    });

    await notification.save();
    console.log('🔔 Notification created successfully:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Check if user has notification settings enabled for specific type
const checkNotificationSettings = async (userId, notificationType) => {
  try {
    console.log(`🔔 Checking notification settings for user ${userId}, type ${notificationType}`);
    
    const user = await User.findById(userId).select('notificationSettings');
    console.log('🔔 User found:', user ? 'Yes' : 'No');
    
    if (!user || !user.notificationSettings) {
      // If no settings found, default to true (allow notifications)
      console.log('🔔 No settings found, defaulting to true');
      return true;
    }

    const settings = user.notificationSettings;
    console.log('🔔 User notification settings:', settings);
    
    // Map notification types to settings
    const typeToSettingMap = {
      'post_like': 'someonelikedMyPosts',
      'post_comment': 'someoneCommentedOnMyPosts',
      'post_share': 'someoneSharedOnMyPosts',
      'follow': 'someoneFollowedMe',
      'page_like': 'someoneLikedMyPages',
      'profile_visit': 'someoneVisitedMyProfile',
      'mention': 'someoneMentionedMe',
      'group_join': 'someoneJoinedMyGroups',
      'friend_request_accepted': 'someoneAcceptedMyFriendRequest',
      'timeline_post': 'someonePostedOnMyTimeline'
    };

    const settingKey = typeToSettingMap[notificationType];
    console.log(`🔔 Mapped setting key for type ${notificationType}:`, settingKey);
    
    if (!settingKey) {
      // If type not mapped, default to true
      console.log('🔔 Type not mapped, defaulting to true');
      return true;
    }

    const settingValue = settings[settingKey];
    console.log(`🔔 Setting value for ${settingKey}:`, settingValue);
    
    const result = settingValue !== false; // Return true if setting is not explicitly false
    console.log(`🔔 Final result:`, result);
    
    return result;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    // Default to true if there's an error
    return true;
  }
};

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  checkNotificationSettings
}; 