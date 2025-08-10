const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if Cloudinary credentials are properly configured
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET &&
                              process.env.CLOUDINARY_CLOUD_NAME !== 'dqkleyh2z' &&
                              process.env.CLOUDINARY_API_KEY !== '889535112914175' &&
                              process.env.CLOUDINARY_API_SECRET !== 'RuzBYlHCZ64uWyLwsAjyW4zB8XI';

console.log('☁️ Cloudinary configuration check:');
console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('  - API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');
console.log('  - Fully configured:', isCloudinaryConfigured ? 'Yes' : 'No');

// Configure Cloudinary only if credentials are available
if (isCloudinaryConfigured) {
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️ Cloudinary not configured - using local storage fallback');
}

// Configure storage based on availability
let storage;
if (isCloudinaryConfigured) {
  // Use Cloudinary storage
  storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jaifriend-media',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Limit image size
      { quality: 'auto:good' } // Optimize quality
    ],
    resource_type: 'auto' // Auto-detect resource type (image/video)
  }
});
} else {
  // Use local storage as fallback
  const path = require('path');
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = 'uploads/';
      
      // Create different folders for different types of uploads
      if (file.fieldname === 'avatar') {
        uploadPath += 'profile-photos/';
      } else if (file.fieldname === 'cover') {
        uploadPath += 'cover-photos/';
      } else if (file.fieldname === 'postMedia') {
        uploadPath += 'post-media/';
      } else {
        uploadPath += 'general/';
      }
      
      // Create directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('📁 Using local storage fallback');
}

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured) {
    console.log('⚠️ Cloudinary not configured - skipping delete');
    return;
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ File deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Function to get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  if (!isCloudinaryConfigured) {
    console.log('⚠️ Cloudinary not configured - returning original URL');
    return publicId; // Return the original URL if Cloudinary is not configured
  }
  
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

// Function to generate thumbnail for videos
const generateThumbnail = async (publicId) => {
  if (!isCloudinaryConfigured) {
    console.log('⚠️ Cloudinary not configured - skipping thumbnail generation');
    return null;
  }
  
  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      eager: [
        { width: 300, height: 300, crop: 'fill', quality: 'auto:good' }
      ],
      eager_async: true
    });
    return result.eager[0].secure_url;
  } catch (error) {
    console.error('❌ Error generating thumbnail:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  storage,
  upload,
  deleteFromCloudinary,
  getOptimizedUrl,
  generateThumbnail,
  isCloudinaryConfigured
}; 