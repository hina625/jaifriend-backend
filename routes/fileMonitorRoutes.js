const express = require('express');
const router = express.Router();
const fileMonitor = require('../utils/fileMonitor');

// Start file monitoring
router.post('/start', (req, res) => {
  try {
    fileMonitor.startWatching();
    res.json({ 
      success: true, 
      message: 'File monitor started successfully',
      status: fileMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start file monitor',
      error: error.message 
    });
  }
});

// Stop file monitoring
router.post('/stop', (req, res) => {
  try {
    fileMonitor.stopWatching();
    res.json({ 
      success: true, 
      message: 'File monitor stopped successfully',
      status: fileMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to stop file monitor',
      error: error.message 
    });
  }
});

// Get file monitor status
router.get('/status', (req, res) => {
  try {
    const status = fileMonitor.getStatus();
    res.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file monitor status',
      error: error.message 
    });
  }
});

// Run manual cleanup
router.post('/cleanup', async (req, res) => {
  try {
    await fileMonitor.manualCleanup();
    res.json({ 
      success: true, 
      message: 'Manual cleanup completed successfully',
      status: fileMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run manual cleanup',
      error: error.message 
    });
  }
});

module.exports = router; 