const express = require('express');
const { login, registerUser, setupProfile, getUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', login);



router.post('/setup', authMiddleware, setupProfile);
router.get('/profile', authMiddleware, getUserProfile);



module.exports = router;
