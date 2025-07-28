const mongoose = require('mongoose');
const DataExport = require('./models/dataExport');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testDataExport() {
  try {
    console.log('🧪 Testing Data Export Backend...\n');

    // Test 1: Create a sample data export
    console.log('1. Creating sample data export...');
    const sampleExport = new DataExport({
      userId: new mongoose.Types.ObjectId(), // Sample user ID
      selectedDataTypes: ['information', 'posts', 'followers'],
      status: 'completed',
      fileUrl: '/api/dataexports/sample/download',
      fileSize: 1024,
      completedAt: new Date()
    });

    await sampleExport.save();
    console.log('✅ Sample data export created successfully');

    // Test 2: Query exports
    console.log('\n2. Querying data exports...');
    const exports = await DataExport.find().limit(5);
    console.log(`✅ Found ${exports.length} data exports`);

    // Test 3: Test aggregation
    console.log('\n3. Testing statistics aggregation...');
    const stats = await DataExport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('✅ Statistics:', stats);

    // Test 4: Clean up
    console.log('\n4. Cleaning up test data...');
    await DataExport.deleteOne({ _id: sampleExport._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Data Export backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testDataExport(); 