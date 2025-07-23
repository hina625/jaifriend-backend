const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

// Create a new page
router.post('/', pageController.createPage);

module.exports = router; 