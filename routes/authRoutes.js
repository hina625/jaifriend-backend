const express = require('express');
const { login, registerUser, setupProfile, getUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', login);
router.post('/setup', authMiddleware, setupProfile);
router.get('/profile', authMiddleware, getUserProfile);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, message: 'Google login successful' });
});

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, message: 'Facebook login successful' });
});

// Apple OAuth
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', passport.authenticate('apple', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, message: 'Apple login successful' });
});

module.exports = router;
