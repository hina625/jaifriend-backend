const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Import group controller
const groupController = require('../controllers/groupController');

// Group CRUD operations
router.post('/', auth, upload.single('avatar'), groupController.createGroup);
router.get('/', auth, groupController.getGroups);
router.get('/public', groupController.getPublicGroups);
router.get('/search', auth, groupController.searchGroups);

// Get groups by user ID
router.get('/user/:userId', auth, groupController.getGroupsByUserId);

// Parameterized routes
router.get('/:groupId', auth, groupController.getGroupById);
router.put('/:groupId', auth, upload.single('avatar'), groupController.updateGroup);
router.delete('/:groupId', auth, groupController.deleteGroup);

// Group membership
router.post('/:groupId/join', auth, groupController.joinGroup);
router.post('/:groupId/leave', auth, groupController.leaveGroup);
router.post('/:groupId/invite', auth, groupController.inviteUser);
router.post('/:groupId/approve/:userId', auth, groupController.approveMember);
router.post('/:groupId/reject/:userId', auth, groupController.rejectMember);
router.delete('/:groupId/members/:userId', auth, groupController.removeMember);

// Group roles
router.post('/:groupId/promote/:userId', auth, groupController.promoteMember);
router.post('/:groupId/demote/:userId', auth, groupController.demoteMember);
router.post('/:groupId/add-admin/:userId', auth, groupController.addAdmin);
router.post('/:groupId/remove-admin/:userId', auth, groupController.removeAdmin);

// Group content
router.get('/:groupId/posts', auth, groupController.getGroupPosts);
router.post('/:groupId/posts', auth, groupController.createGroupPost);
router.get('/:groupId/events', auth, groupController.getGroupEvents);
router.post('/:groupId/events', auth, groupController.createGroupEvent);

// Group settings
router.get('/:groupId/settings', auth, groupController.getGroupSettings);
router.put('/:groupId/settings', auth, groupController.updateGroupSettings);
router.post('/:groupId/rules', auth, groupController.addGroupRule);
router.put('/:groupId/rules/:ruleId', auth, groupController.updateGroupRule);
router.delete('/:groupId/rules/:ruleId', auth, groupController.deleteGroupRule);

// Group analytics
router.get('/:groupId/stats', auth, groupController.getGroupStats);
router.get('/:groupId/members', auth, groupController.getGroupMembers);

module.exports = router; 