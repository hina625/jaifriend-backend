const UserImage = require('../models/userImage');
const fs = require('fs');
const path = require('path');

// Get user images
exports.getUserImages = async (req, res) => {
  try {
    console.log('getUserImages called');
    console.log('req.user:', req.user);
    console.log('req.userId:', req.userId);
    
    const userId = req.user.id;
    console.log('Extracted userId:', userId);
    
    let userImage = await UserImage.findOne({ userId });
    console.log('Found userImage:', userImage);
    
    // If no user image record exists, create one
    if (!userImage) {
      console.log('Creating new userImage record');
      userImage = new UserImage({ userId });
      await userImage.save();
      console.log('New userImage saved:', userImage);
    }
    
    const response = {
      avatar: userImage.avatar,
      cover: userImage.cover,
      userId: userId
    };
    console.log('📤 getUserImages response:', response);
    
    res.json(response);
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
    console.log('uploadAvatar called');
    console.log('req.user:', req.user);
    console.log('req.file:', req.file);
    
    const userId = req.user.id;
    console.log('userId:', userId);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle both Cloudinary and local storage URLs
    let cloudinaryUrl;
    let publicId;
    
    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL
      cloudinaryUrl = req.file.path;
      publicId = req.file.filename;
    } else {
      // Local storage URL - construct full URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://jaifriend-backend-production.up.railway.app'
        : 'http://localhost:3001';
      
      // req.file.path for local storage will be something like 'uploads\\profile-photos\\filename.jpg'
      // We need to convert backslashes and ensure the path is relative to the base URL's /uploads
      const relativePath = req.file.path.replace(/\\/g, '/'); // Convert backslashes to forward slashes
      // If req.file.path already starts with 'uploads/', just use it. Otherwise, prepend 'uploads/'
      const finalRelativePath = relativePath.startsWith('uploads/') ? relativePath : `uploads/${relativePath}`;
      
      cloudinaryUrl = `${baseUrl}/${finalRelativePath}`;
      publicId = req.file.filename;
    }
    
    console.log('cloudinaryUrl:', cloudinaryUrl);
    console.log('publicId:', publicId);
    console.log('File path:', req.file.path);
    console.log('File filename:', req.file.filename);

    let userImage = await UserImage.findOne({ userId });
    console.log('Found userImage:', userImage);
    
    if (!userImage) {
      console.log('Creating new userImage for avatar');
      userImage = new UserImage({ userId });
    }

    // Delete old avatar from Cloudinary if it exists
    if (userImage.avatar && userImage.avatar.includes('cloudinary.com')) {
      try {
        const { deleteFromCloudinary } = require('../config/cloudinary');
        const oldPublicId = userImage.avatar.split('/').pop().split('.')[0]; // Extract public ID
        await deleteFromCloudinary(oldPublicId);
        console.log('✅ Old avatar deleted from Cloudinary:', oldPublicId);
      } catch (error) {
        console.error('❌ Error deleting old avatar:', error);
      }
    }

    userImage.avatar = cloudinaryUrl;
    userImage.avatarPublicId = publicId;
    await userImage.save();
    console.log('✅ Saved userImage:', userImage);

    // Also update the main User model to keep it synchronized
    const User = require('../models/user');
    const updatedUser = await User.findByIdAndUpdate(userId, { avatar: cloudinaryUrl }, { new: true });
    console.log('✅ Updated User model avatar:', updatedUser?.avatar);

    // Verify the data was saved correctly
    const verifyUserImage = await UserImage.findOne({ userId });
    const verifyUser = await User.findById(userId);
    console.log('✅ Verification - UserImage avatar:', verifyUserImage?.avatar);
    console.log('✅ Verification - User avatar:', verifyUser?.avatar);

    const response = {
      message: 'Avatar uploaded successfully',
      avatar: cloudinaryUrl,
      userId: userId
    };
    console.log('📤 Sending response:', response);

    res.json(response);
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

    // Handle both Cloudinary and local storage URLs
    let cloudinaryUrl;
    let publicId;
    
    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL
      cloudinaryUrl = req.file.path;
      publicId = req.file.filename;
    } else {
      // Local storage URL - construct full URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://jaifriend-backend-production.up.railway.app'
        : 'http://localhost:3001';
      
      // req.file.path for local storage will be something like 'uploads\\cover-photos\\filename.jpg'
      // We need to convert backslashes and ensure the path is relative to the base URL's /uploads
      const relativePath = req.file.path.replace(/\\/g, '/'); // Convert backslashes to forward slashes
      // If req.file.path already starts with 'uploads/', just use it. Otherwise, prepend 'uploads/'
      const finalRelativePath = relativePath.startsWith('uploads/') ? relativePath : `uploads/${relativePath}`;
      
      cloudinaryUrl = `${baseUrl}/${finalRelativePath}`;
      publicId = req.file.filename;
    }

    let userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      userImage = new UserImage({ userId });
    }

    // Delete old cover from Cloudinary if it exists
    if (userImage.cover && userImage.cover.includes('cloudinary.com')) {
      try {
        const { deleteFromCloudinary } = require('../config/cloudinary');
        const oldPublicId = userImage.cover.split('/').pop().split('.')[0]; // Extract public ID
        await deleteFromCloudinary(oldPublicId);
        console.log('✅ Old cover deleted from Cloudinary:', oldPublicId);
      } catch (error) {
        console.error('❌ Error deleting old cover:', error);
      }
    }

    console.log('Cover cloudinaryUrl:', cloudinaryUrl);
    console.log('Cover publicId:', publicId);
    console.log('Cover file path:', req.file.path);
    console.log('Cover file filename:', req.file.filename);

    userImage.cover = cloudinaryUrl;
    userImage.coverPublicId = publicId;
    await userImage.save();

    // Also update the main User model to keep it synchronized
    const User = require('../models/user');
    await User.findByIdAndUpdate(userId, { coverPhoto: cloudinaryUrl });
    console.log('✅ Updated User model coverPhoto');

    res.json({
      message: 'Cover uploaded successfully',
      cover: cloudinaryUrl
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