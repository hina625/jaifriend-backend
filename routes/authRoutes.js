const express = require('express');
const { login, registerUser, setupProfile, getUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', login);

// Add token refresh route
router.post('/refresh-token', (req, res) => {
  // This route helps users get a new token if their old one is invalid
  res.status(200).json({ 
    message: 'Please login again to get a new token',
    requiresLogin: true 
  });
});

router.post('/setup', authMiddleware, setupProfile);
router.get('/profile', authMiddleware, getUserProfile);



module.exports = router;
