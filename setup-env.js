const fs = require('fs');
const path = require('path');

// Environment configuration
const envConfig = `# Frontend URL Configuration
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/fedup

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=50mb

# Cloudinary Configuration (for media storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# OAuth Configuration (if using social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
`;

const envPath = path.join(__dirname, '.env');

// Check if .env file already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Please manually update it with the following configuration:');
  console.log('\n' + envConfig);
} else {
  // Create .env file
  fs.writeFileSync(envPath, envConfig);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update the configuration values as needed.');
}

console.log('\n🔧 Configuration Instructions:');
console.log('1. Update FRONTEND_URL to match your frontend application URL');
console.log('2. Set up your MongoDB connection string in MONGO_URI');
console.log('3. Generate secure JWT_SECRET and SESSION_SECRET for production');
console.log('4. Configure Cloudinary credentials for media storage:');
console.log('   - Sign up at https://cloudinary.com');
console.log('   - Get your Cloud Name, API Key, and API Secret from dashboard');
console.log('   - Update CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
console.log('5. Configure OAuth credentials if using social login');
console.log('\n🚀 Your Express app is now configured to use the frontend URL in all routes!'); 