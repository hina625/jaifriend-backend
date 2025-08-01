const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
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
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

// Function to generate thumbnail for videos
const generateThumbnail = async (publicId) => {
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
  generateThumbnail
}; 