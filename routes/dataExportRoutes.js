const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createDataExport,
  getUserDataExports,
  getDataExportById,
  downloadDataExport,
  getDataExportStats
} = require('../controllers/dataExportController');

// All routes require authentication
router.use(authMiddleware);

// Create new data export request
router.post('/', createDataExport);

// Get user's data export history
router.get('/', getUserDataExports);

// Get data export statistics
router.get('/stats', getDataExportStats);

// Get specific data export by ID
router.get('/:exportId', getDataExportById);

// Download data export file
router.get('/:exportId/download', downloadDataExport);

module.exports = router; 