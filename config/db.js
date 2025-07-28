const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/social-media-app';
    
    await mongoose.connect(mongoURI, {
      // Remove deprecated options
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions:');
      console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.log('2. Use MongoDB Atlas (cloud): https://cloud.mongodb.com');
      console.log('3. Set MONGO_URI in your .env file');
    }
    
    // Don't exit process, let server continue without database
    return false;
  }
};

module.exports = connectDB;
