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
    
    // Check if Cloudinary is configured and being used
    const { isCloudinaryConfigured } = require('../config/cloudinary');
    
    console.log('🔍 DEBUG: isCloudinaryConfigured:', isCloudinaryConfigured);
    console.log('🔍 DEBUG: req.file.path:', req.file.path);
    console.log('🔍 DEBUG: req.file.path starts with http:', req.file.path && req.file.path.startsWith('http'));
    
    if (isCloudinaryConfigured && req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL - use the secure URL directly
      cloudinaryUrl = req.file.path;
      publicId = req.file.filename;
      console.log('☁️ Cloudinary storage - URL:', cloudinaryUrl);
      console.log('☁️ Cloudinary storage - Public ID:', publicId);
    } else {
      // Local storage URL - construct full URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://jaifriend-backend-production.up.railway.app'
        : 'http://localhost:3001';
      
      // Extract just the filename from the path
      const filename = req.file.filename;
      cloudinaryUrl = `${baseUrl}/uploads/profile-photos/${filename}`;
      publicId = filename;
      
      console.log('📁 Local storage - Base URL:', baseUrl);
      console.log('📁 Local storage - Filename:', filename);
      console.log('📁 Local storage - Final URL:', cloudinaryUrl);
      console.log('⚠️ WARNING: Using local storage even though Cloudinary is configured!');
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
    
    // Check if Cloudinary is configured and being used
    const { isCloudinaryConfigured } = require('../config/cloudinary');
    
    console.log('🔍 DEBUG COVER: isCloudinaryConfigured:', isCloudinaryConfigured);
    console.log('🔍 DEBUG COVER: req.file.path:', req.file.path);
    console.log('🔍 DEBUG COVER: req.file.path starts with http:', req.file.path && req.file.path.startsWith('http'));
    
    if (isCloudinaryConfigured && req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL - use the secure URL directly
      cloudinaryUrl = req.file.path;
      publicId = req.file.filename;
      console.log('☁️ Cloudinary storage - Cover URL:', cloudinaryUrl);
      console.log('☁️ Cloudinary storage - Cover Public ID:', publicId);
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

// Clean up localhost URLs in database
exports.cleanupLocalhostUrls = async (req, res) => {
  try {
    console.log('🧹 Starting localhost URL cleanup...');
    
    const UserImage = require('../models/userImage');
    const User = require('../models/user');
    
    // Find all user images with localhost URLs
    const userImages = await UserImage.find({
      $or: [
        { avatar: { $regex: /localhost:3000/ } },
        { cover: { $regex: /localhost:3000/ } }
      ]
    });
    
    console.log(`📊 Found ${userImages.length} user images with localhost URLs`);
    
    let updatedCount = 0;
    
    for (const userImage of userImages) {
      let updated = false;
      
      // Fix avatar URL
      if (userImage.avatar && userImage.avatar.includes('localhost:3000')) {
        userImage.avatar = userImage.avatar.replace('http://localhost:3000', 'https://jaifriend-backend-production.up.railway.app');
        updated = true;
        console.log(`🖼️ Fixed avatar URL for user ${userImage.userId}`);
      }
      
      // Fix cover URL
      if (userImage.cover && userImage.cover.includes('localhost:3000')) {
        userImage.cover = userImage.cover.replace('http://localhost:3000', 'https://jaifriend-backend-production.up.railway.app');
        updated = true;
        console.log(`🖼️ Fixed cover URL for user ${userImage.userId}`);
      }
      
      if (updated) {
        await userImage.save();
        updatedCount++;
        
        // Also update User model
        await User.findByIdAndUpdate(userImage.userId, {
          avatar: userImage.avatar
        });
      }
    }
    
    console.log(`✅ Cleanup completed: ${updatedCount} records updated`);
    
    res.json({
      message: 'Localhost URL cleanup completed',
      totalFound: userImages.length,
      updatedCount: updatedCount
    });
    
  } catch (error) {
    console.error('❌ Error during localhost URL cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup localhost URLs' });
  }
};

// Migrate existing profile photos to Cloudinary URLs
exports.migrateToCloudinary = async (req, res) => {
  try {
    console.log('☁️ Starting migration to Cloudinary...');
    
    const { isCloudinaryConfigured } = require('../config/cloudinary');
    
    if (!isCloudinaryConfigured) {
      return res.status(400).json({ 
        error: 'Cloudinary not configured. Please set up Cloudinary credentials first.' 
      });
    }
    
    const UserImage = require('../models/userImage');
    const User = require('../models/user');
    
    // Find all user images with local storage URLs (both localhost and production)
    const userImages = await UserImage.find({
      $or: [
        { avatar: { $regex: /uploads\/profile-photos/ } },
        { cover: { $regex: /uploads\/cover-photos/ } },
        { avatar: { $regex: /localhost:3000/ } },
        { cover: { $regex: /localhost:3000/ } }
      ]
    });
    
    console.log(`📊 Found ${userImages.length} user images with local storage URLs`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const userImage of userImages) {
      try {
        let updated = false;
        
        // Handle avatar migration
        if (userImage.avatar && (userImage.avatar.includes('uploads/profile-photos') || userImage.avatar.includes('localhost:3000'))) {
          console.log(`🔄 Migrating avatar for user ${userImage.userId}: ${userImage.avatar}`);
          
          // For now, we'll mark these as needing manual migration since we can't re-upload the files
          // In a real scenario, you'd need to download the file and re-upload to Cloudinary
          userImage.avatar = `NEEDS_MIGRATION:${userImage.avatar}`;
          userImage.avatarPublicId = null;
          updated = true;
        }
        
        // Handle cover migration
        if (userImage.cover && (userImage.cover.includes('uploads/cover-photos') || userImage.cover.includes('localhost:3000'))) {
          console.log(`🔄 Migrating cover for user ${userImage.userId}: ${userImage.cover}`);
          
          userImage.cover = `NEEDS_MIGRATION:${userImage.cover}`;
          userImage.coverPublicId = null;
          updated = true;
        }
        
        if (updated) {
          await userImage.save();
          migratedCount++;
          console.log(`✅ Migrated user ${userImage.userId}`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userImage.userId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration completed: ${migratedCount} records migrated, ${errorCount} errors`);
    
    res.json({
      message: 'Migration to Cloudinary completed',
      totalFound: userImages.length,
      migratedCount: migratedCount,
      errorCount: errorCount,
      note: 'Files marked with NEEDS_MIGRATION require manual re-upload to Cloudinary'
    });
    
  } catch (error) {
    console.error('❌ Error during migration to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to migrate to Cloudinary' });
  }
}; 

// Get user images by user ID (for viewing other users' profiles)
exports.getUserImagesById = async (req, res) => {
  try {
    console.log('getUserImagesById called');
    console.log('req.params.userId:', req.params.userId);
    
    const userId = req.params.userId;
    console.log('Target userId:', userId);
    
    let userImage = await UserImage.findOne({ userId });
    console.log('Found userImage:', userImage);
    
    // If no user image record exists, return empty data
    if (!userImage) {
      console.log('No userImage record found for userId:', userId);
      const response = {
        avatar: null,
        cover: null,
        userId: userId
      };
      console.log('📤 getUserImagesById response (no data):', response);
      return res.json(response);
    }
    
    const response = {
      avatar: userImage.avatar,
      cover: userImage.cover,
      userId: userId
    };
    console.log('📤 getUserImagesById response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user images by ID:', error);
    res.status(500).json({ error: 'Failed to fetch user images' });
  }
}; 