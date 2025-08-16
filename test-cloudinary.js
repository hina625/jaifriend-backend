require('dotenv').config();
const { cloudinary, isCloudinaryConfigured } = require('./config/cloudinary');

console.log('🧪 Testing Cloudinary Configuration...\n');

console.log('Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

console.log('\nConfiguration Status:');
console.log('isCloudinaryConfigured:', isCloudinaryConfigured ? '✅ Yes' : '❌ No');

if (isCloudinaryConfigured) {
  console.log('\n🔗 Testing Cloudinary Connection...');
  
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary connection successful!');
      console.log('Response:', result);
    })
    .catch(error => {
      console.error('❌ Cloudinary connection failed:');
      console.error('Error:', error.message);
    });
} else {
  console.log('\n⚠️  Cloudinary not configured. To fix this:');
  console.log('1. Create a .env file in the my-express-app directory');
  console.log('2. Add your Cloudinary credentials:');
  console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('   CLOUDINARY_API_KEY=your_api_key');
  console.log('   CLOUDINARY_API_SECRET=your_api_secret');
  console.log('3. Restart the server');
}
