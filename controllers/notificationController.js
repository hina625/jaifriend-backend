const Notification = require('../models/notification');
const User = require('../models/user');
const Post = require('../models/post');

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.userId;
    
    const query = {
      recipient: userId,
      isDeleted: false
    };
    
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'name username avatar')
      .populate('post', 'content media')
      .populate('group', 'name avatar')
      .populate('event', 'title description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Notification.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.markAsRead();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark multiple notifications as read
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.userId;
    
    await Notification.markAsRead(userId, notificationIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.softDelete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete multiple notifications
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.userId;
    
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId
      },
      {
        $set: { isDeleted: true }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    
    await Notification.updateMany(
      {
        recipient: userId,
        isDeleted: false
      },
      {
        $set: { isDeleted: true }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create notification (utility function for other controllers)
exports.createNotification = async (data) => {
  try {
    // Check if notification already exists (to prevent duplicates)
    const existingNotification = await Notification.findOne({
      sender: data.sender,
      recipient: data.recipient,
      type: data.type,
      post: data.post,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
    });
    
    if (existingNotification) {
      return existingNotification;
    }
    
    // Check recipient's notification settings
    const recipient = await User.findById(data.recipient);
    if (!recipient) return null;
    
    const shouldNotify = recipient.settings?.notifications?.[data.type] !== false;
    if (!shouldNotify) return null;
    
    return await Notification.createNotification(data);
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('settings');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.settings?.notifications || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { notifications } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.settings) user.settings = {};
    user.settings.notifications = { ...user.settings.notifications, ...notifications };
    
    await user.save();
    res.json(user.settings.notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: userId,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: ['$isRead', 0, 1]
            }
          }
        }
      }
    ]);
    
    const totalUnread = await Notification.getUnreadCount(userId);
    
    res.json({
      stats,
      totalUnread
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 