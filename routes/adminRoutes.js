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

module.exports = router; 