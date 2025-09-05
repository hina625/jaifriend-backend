const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if Cloudinary credentials are properly configured
const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET);

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
  
  // Test Cloudinary connection
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary connection test successful:', result);
    })
    .catch(error => {
      console.error('❌ Cloudinary connection test failed:', error);
    });
} else {
  console.log('⚠️ Cloudinary not configured - using local storage fallback');
  console.log('💡 To enable Cloudinary, set these environment variables:');
  console.log('   - CLOUDINARY_CLOUD_NAME');
  console.log('   - CLOUDINARY_API_KEY');
  console.log('   - CLOUDINARY_API_SECRET');
}

// Configure storage based on availability
let storage;
if (isCloudinaryConfigured) {
  console.log('☁️ Configuring Cloudinary storage...');
  // Use Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'jaifriend-media',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'aac', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
      resource_type: 'auto',
      // Ensure we get the full URL
      transformation: [
        { quality: 'auto:good' }
      ]
    }
  });
  console.log('✅ Cloudinary storage configured successfully');
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
    fileSize: 100 * 1024 * 1024, // Increased to 100MB for larger files like PDFs and videos
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log(`🔍 File filter checking: ${file.originalname} (${file.mimetype})`);
      
      // Allow images, videos, documents, and audio files
      const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Videos
        'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/3gpp', 'video/quicktime',
        // Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/rtf', 'text/html', 'text/css', 'text/javascript',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
      ];
      
      // Also check file extension for better compatibility
      const fileExtension = file.originalname.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'pdf', 'doc', 'docx', 'txt', 'rtf', 'zip', 'rar', '7z'];
      
      if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
        cb(null, true);
      } else {
        console.log(`❌ File type not supported: ${file.mimetype} for file: ${file.originalname}`);
        cb(new Error(`File type not supported: ${file.mimetype}`), false);
      }
    } catch (error) {
      console.error('❌ Error in file filter:', error);
      cb(error, false);
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