const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');

// Get all notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Get notification statistics
router.get('/stats', auth, notificationController.getNotificationStats);

// Mark multiple notifications as read
router.put('/mark-read', auth, notificationController.markMultipleAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Delete multiple notifications
router.delete('/delete-multiple', auth, notificationController.deleteMultipleNotifications);

// Clear all notifications
router.delete('/clear-all', auth, notificationController.clearAllNotifications);

// Get notification settings
router.get('/settings', auth, notificationController.getNotificationSettings);

// Update notification settings
router.put('/settings', auth, notificationController.updateNotificationSettings);

// Parameterized routes (must come after specific routes)
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router; 