const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middlewares/authMiddleware');

// Create a new job (requires authentication)
router.post('/', auth, jobController.createJob);

// Get jobs by page ID (public)
router.get('/page/:pageId', jobController.getJobsByPage);

// Get job by ID (public)
router.get('/:id', jobController.getJobById);

// Apply for a job (requires authentication)
router.post('/:id/apply', auth, jobController.applyForJob);

// Update job (requires authentication)
router.put('/:id', auth, jobController.updateJob);

// Delete job (requires authentication)
router.delete('/:id', auth, jobController.deleteJob);

module.exports = router;
