const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin dashboard statistics
router.get('/stats', authMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminController.getUsers);
router.get('/posts', authMiddleware, adminController.getPosts);
router.get('/comments', authMiddleware, adminController.getComments);
router.get('/groups', authMiddleware, adminController.getGroups);
router.get('/pages', authMiddleware, adminController.getPages);
router.get('/games', authMiddleware, adminController.getGames);
router.get('/messages', authMiddleware, adminController.getMessages);

// User management routes
router.post('/users/:userId/verify', authMiddleware, adminController.verifyUser);
router.post('/users/:userId/unverify', authMiddleware, adminController.unverifyUser);
router.post('/users/:userId/block', authMiddleware, adminController.blockUser);
router.post('/users/:userId/unblock', authMiddleware, adminController.unblockUser);
router.post('/users/:userId/delete', authMiddleware, adminController.deleteUser);
router.post('/users/:userId/kick', authMiddleware, adminController.kickUser);
router.post('/users/bulk/:action', authMiddleware, adminController.bulkAction);
router.get('/users/stats', authMiddleware, adminController.getUserStats);
router.get('/users/online', authMiddleware, adminController.getOnlineUsers);

module.exports = router; 