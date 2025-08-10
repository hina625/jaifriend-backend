const DataExport = require('../models/dataExport');
const User = require('../models/user');
const Post = require('../models/post');
const Group = require('../models/group');
const Page = require('../models/page');

// Create a new data export request
const createDataExport = async (req, res) => {
  try {
    const { selectedDataTypes } = req.body;
    const userId = req.user.id;

    // Validate selected data types
    if (!selectedDataTypes || !Array.isArray(selectedDataTypes) || selectedDataTypes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select at least one data type to export' 
      });
    }

    // Check if user has a pending export
    const existingExport = await DataExport.findOne({
      userId,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingExport) {
      return res.status(400).json({
        success: false,
        message: 'You already have a data export in progress. Please wait for it to complete.'
      });
    }

    // Create new export request
    const dataExport = new DataExport({
      userId,
      selectedDataTypes
    });

    await dataExport.save();

    // Start processing in background (simulate)
    setTimeout(async () => {
      try {
        await processDataExport(dataExport._id, userId, selectedDataTypes);
      } catch (error) {
        console.error('Error processing data export:', error);
        await DataExport.findByIdAndUpdate(dataExport._id, {
          status: 'failed'
        });
      }
    }, 1000);

    res.status(201).json({
      success: true,
      message: 'Data export request created successfully',
      data: {
        exportId: dataExport._id,
        status: dataExport.status,
        selectedDataTypes: dataExport.selectedDataTypes
      }
    });

  } catch (error) {
    console.error('Error creating data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data export request'
    });
  }
};

// Get user's data export history
const getUserDataExports = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const exports = await DataExport.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await DataExport.countDocuments({ userId });

    // Add full download URLs to exports
    const frontendUrl = req.frontendUrl || 'http://localhost:3000';
    const exportsWithUrls = exports.map(exportItem => ({
      ...exportItem.toObject(),
      fullDownloadUrl: exportItem.status === 'completed' ? 
        `${frontendUrl}${exportItem.fileUrl}` : null
    }));

    res.json({
      success: true,
      data: {
        exports: exportsWithUrls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user data exports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data exports'
    });
  }
};

// Get specific data export by ID
const getDataExportById = async (req, res) => {
  try {
    const { exportId } = req.params;
    const userId = req.user.id;

    const dataExport = await DataExport.findOne({
      _id: exportId,
      userId
    });

    if (!dataExport) {
      return res.status(404).json({
        success: false,
        message: 'Data export not found'
      });
    }

    res.json({
      success: true,
      data: dataExport
    });

  } catch (error) {
    console.error('Error fetching data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data export'
    });
  }
};

// Download data export file
const downloadDataExport = async (req, res) => {
  try {
    const { exportId } = req.params;
    const userId = req.user.id;

    const dataExport = await DataExport.findOne({
      _id: exportId,
      userId,
      status: 'completed'
    });

    if (!dataExport) {
      return res.status(404).json({
        success: false,
        message: 'Data export not found or not completed'
      });
    }

    if (dataExport.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Data export file has expired'
      });
    }

    // Generate full download URL with frontend URL
    const frontendUrl = req.frontendUrl || 'http://localhost:3000';
    const fullDownloadUrl = `${frontendUrl}${dataExport.fileUrl}`;

    res.json({
      success: true,
      data: {
        downloadUrl: dataExport.fileUrl,
        fullDownloadUrl: fullDownloadUrl,
        fileName: `data-export-${exportId}.json`,
        fileSize: dataExport.fileSize,
        expiresAt: dataExport.expiresAt
      }
    });

  } catch (error) {
    console.error('Error downloading data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download data export'
    });
  }
};

// Process data export (background function)
const processDataExport = async (exportId, userId, selectedDataTypes) => {
  try {
    // Update status to processing
    await DataExport.findByIdAndUpdate(exportId, { status: 'processing' });

    // Collect data based on selected types
    const exportData = {};

    if (selectedDataTypes.includes('information')) {
      const user = await User.findById(userId).select('-password');
      exportData.userInformation = user;
    }

    if (selectedDataTypes.includes('posts')) {
      const posts = await Post.find({ userId }).sort({ createdAt: -1 });
      exportData.posts = posts;
    }

    if (selectedDataTypes.includes('groups')) {
      const groups = await Group.find({ members: userId });
      exportData.groups = groups;
    }

    if (selectedDataTypes.includes('pages')) {
      const pages = await Page.find({ owner: userId });
      exportData.pages = pages;
    }

    if (selectedDataTypes.includes('followers')) {
      const user = await User.findById(userId).populate('followersList');
      exportData.followers = user.followersList || [];
    }

    if (selectedDataTypes.includes('following')) {
      const user = await User.findById(userId).populate('followingList');
      exportData.following = user.followingList || [];
    }

    // Create file content
    const fileContent = JSON.stringify(exportData, null, 2);
    const fileSize = Buffer.byteLength(fileContent, 'utf8');

    // In a real implementation, you would save this to a file storage service
    // For now, we'll simulate a file URL
    const fileUrl = `/api/dataexports/${exportId}/file`;

    // Update export with completed status
    await DataExport.findByIdAndUpdate(exportId, {
      status: 'completed',
      fileUrl,
      fileSize,
      completedAt: new Date()
    });

    console.log(`Data export ${exportId} completed successfully`);

  } catch (error) {
    console.error('Error processing data export:', error);
    await DataExport.findByIdAndUpdate(exportId, {
      status: 'failed'
    });
  }
};

// Get data export statistics
const getDataExportStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await DataExport.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalExports = await DataExport.countDocuments({ userId });
    const pendingExports = await DataExport.countDocuments({ 
      userId, 
      status: { $in: ['pending', 'processing'] } 
    });

    res.json({
      success: true,
      data: {
        totalExports,
        pendingExports,
        statusBreakdown: stats
      }
    });

  } catch (error) {
    console.error('Error fetching data export stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data export statistics'
    });
  }
};

module.exports = {
  createDataExport,
  getUserDataExports,
  getDataExportById,
  downloadDataExport,
  getDataExportStats
}; 