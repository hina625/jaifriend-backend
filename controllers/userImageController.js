const UserImage = require('../models/userImage');
const fs = require('fs');
const path = require('path');

// Get user images
exports.getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let userImage = await UserImage.findOne({ userId });
    
    // If no user image record exists, create one
    if (!userImage) {
      userImage = new UserImage({ userId });
      await userImage.save();
    }
    
    res.json({
      avatar: userImage.avatar,
      cover: userImage.cover
    });
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({ error: 'Failed to fetch user images' });
  }
};

// Update user images
exports.updateUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar, cover } = req.body;

    let userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      userImage = new UserImage({ userId });
    }

    // Update only provided fields
    if (avatar !== undefined) {
      userImage.avatar = avatar;
    }
    if (cover !== undefined) {
      userImage.cover = cover;
    }

    await userImage.save();
    
    res.json({
      message: 'Images updated successfully',
      images: {
        avatar: userImage.avatar,
        cover: userImage.cover
      }
    });
  } catch (error) {
    console.error('Error updating user images:', error);
    res.status(500).json({ error: 'Failed to update user images' });
  }
};

// Upload avatar image
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/${fileName}`;

    let userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      userImage = new UserImage({ userId });
    }

    // Delete old avatar file if exists
    if (userImage.avatarFileName) {
      const oldFilePath = path.join(__dirname, '..', 'uploads', userImage.avatarFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    userImage.avatar = filePath;
    userImage.avatarFileName = fileName;
    await userImage.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: filePath
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Upload cover image
exports.uploadCover = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/${fileName}`;

    let userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      userImage = new UserImage({ userId });
    }

    // Delete old cover file if exists
    if (userImage.coverFileName) {
      const oldFilePath = path.join(__dirname, '..', 'uploads', userImage.coverFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    userImage.cover = filePath;
    userImage.coverFileName = fileName;
    await userImage.save();

    res.json({
      message: 'Cover uploaded successfully',
      cover: filePath
    });
  } catch (error) {
    console.error('Error uploading cover:', error);
    res.status(500).json({ error: 'Failed to upload cover' });
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      return res.status(404).json({ error: 'User images not found' });
    }

    // Delete file if exists
    if (userImage.avatarFileName) {
      const filePath = path.join(__dirname, '..', 'uploads', userImage.avatarFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    userImage.avatar = null;
    userImage.avatarFileName = null;
    await userImage.save();

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
};

// Delete cover
exports.deleteCover = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      return res.status(404).json({ error: 'User images not found' });
    }

    // Delete file if exists
    if (userImage.coverFileName) {
      const filePath = path.join(__dirname, '..', 'uploads', userImage.coverFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    userImage.cover = null;
    userImage.coverFileName = null;
    await userImage.save();

    res.json({ message: 'Cover deleted successfully' });
  } catch (error) {
    console.error('Error deleting cover:', error);
    res.status(500).json({ error: 'Failed to delete cover' });
  }
}; 