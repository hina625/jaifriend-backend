// Test script to check environment variables
console.log('🔍 Starting Environment Variables Test...');

// Load dotenv
const dotenv = require('dotenv');
const result = dotenv.config();

console.log('📁 .env file load result:', result);

console.log('🔍 Environment Variables Test:');
console.log('===============================');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
console.log('===============================');

// Check if they exist
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  console.log('✅ All Cloudinary variables are set!');
} else {
  console.log('❌ Some Cloudinary variables are missing!');
  console.log('Missing variables:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.log('  - CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) console.log('  - CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) console.log('  - CLOUDINARY_API_SECRET');
}
