const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'reply', 'follow', 'share', 'mention', 'message', 'group_invite', 'event_invite'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ sender: 1, type: 1, post: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this({
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    post: data.post,
    comment: data.comment,
    group: data.group,
    event: data.event,
    message: data.message,
    metadata: data.metadata || {}
  });
  
  return await notification.save();
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipientId, notificationIds) {
  return await this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: recipientId
    },
    {
      $set: { isRead: true }
    }
  );
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function(recipientId) {
  return await this.updateMany(
    {
      recipient: recipientId,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return await this.countDocuments({
    recipient: recipientId,
    isRead: false,
    isDeleted: false
  });
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method to soft delete
notificationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema); 