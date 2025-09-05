const File = require('../models/file');
const Post = require('../models/post');
const { upload } = require('../config/cloudinary');

// Upload file for post
exports.uploadFile = async (req, res) => {
  try {
    const uploadSingle = upload.single('file');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const currentUserId = req.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { postId, description } = req.body;

      // Create file record
      const file = new File({
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: req.file.path,
        publicId: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        postId: postId,
        uploadedBy: currentUserId
      });

      await file.save();

      // Add file to post if postId is provided
      if (postId) {
        const post = await Post.findById(postId);
        if (post) {
          await post.addFile({
            fileId: file._id,
            name: file.originalName,
            size: file.size,
            type: file.mimetype
          });
        }
      }

      res.json({
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          originalName: file.originalName,
          url: file.url,
          size: file.size,
          mimetype: file.mimetype,
          category: file.category,
          extension: file.extension
        }
      });
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload multiple files for post
exports.uploadMultipleFiles = async (req, res) => {
  try {
    const uploadMultiple = upload.array('files', 10);
    
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const currentUserId = req.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { postId } = req.body;

      const uploadedFiles = [];

      for (const file of req.files) {
        // Create file record
        const fileRecord = new File({
          originalName: file.originalname,
          filename: file.filename,
          url: file.path,
          publicId: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          postId: postId,
          uploadedBy: currentUserId
        });

        await fileRecord.save();
        uploadedFiles.push(fileRecord);

        // Add file to post if postId is provided
        if (postId) {
          const post = await Post.findById(postId);
          if (post) {
            await post.addFile({
              fileId: fileRecord._id,
              name: fileRecord.originalName,
              size: fileRecord.size,
              type: fileRecord.mimetype
            });
          }
        }
      }

      res.json({
        message: `${uploadedFiles.length} files uploaded successfully`,
        files: uploadedFiles.map(file => ({
          id: file._id,
          originalName: file.originalName,
          url: file.url,
          size: file.size,
          mimetype: file.mimetype,
          category: file.category,
          extension: file.extension
        }))
      });
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get file by ID
exports.getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype,
        category: file.category,
        extension: file.extension,
        downloadCount: file.downloadCount,
        uploadedAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count
    await file.incrementDownload();

    res.json({
      message: 'File download initiated',
      file: {
        id: file._id,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const currentUserId = req.userId;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file or is admin
    if (file.uploadedBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Remove file from post
    if (file.postId) {
      const post = await Post.findById(file.postId);
      if (post) {
        await post.removeFile(fileId);
      }
    }

    // Delete file record
    await File.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get files by post ID
exports.getFilesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const files = await File.find({ postId }).sort({ createdAt: -1 });

    res.json({
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype,
        category: file.category,
        extension: file.extension,
        downloadCount: file.downloadCount,
        uploadedAt: file.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting files by post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get files by user
exports.getFilesByUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const files = await File.find({ uploadedBy: currentUserId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments({ uploadedBy: currentUserId });

    res.json({
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype,
        category: file.category,
        extension: file.extension,
        downloadCount: file.downloadCount,
        uploadedAt: file.createdAt
      })),
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalFiles: total
    });
  } catch (error) {
    console.error('Error getting files by user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
