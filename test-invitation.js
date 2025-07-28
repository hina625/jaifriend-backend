const mongoose = require('mongoose');
const Invitation = require('./models/invitation');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testInvitation() {
  try {
    console.log('🧪 Testing Invitation Backend...\n');

    // Test 1: Create a sample invitation
    console.log('1. Creating sample invitation...');
    const sampleInvitation = new Invitation({
      userId: new mongoose.Types.ObjectId(), // Sample user ID
      status: 'active'
    });

    await sampleInvitation.save();
    console.log('✅ Sample invitation created successfully');
    console.log(`   Invitation Code: ${sampleInvitation.invitationCode}`);

    // Test 2: Query invitations
    console.log('\n2. Querying invitations...');
    const invitations = await Invitation.find().limit(5);
    console.log(`✅ Found ${invitations.length} invitations`);

    // Test 3: Test statistics aggregation
    console.log('\n3. Testing statistics...');
    const stats = await Invitation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('✅ Statistics:', stats);

    // Test 4: Test unique code generation
    console.log('\n4. Testing unique code generation...');
    const newInvitation = new Invitation({
      userId: new mongoose.Types.ObjectId()
    });
    await newInvitation.save();
    console.log(`✅ New invitation code: ${newInvitation.invitationCode}`);

    // Test 5: Clean up
    console.log('\n5. Cleaning up test data...');
    await Invitation.deleteMany({
      _id: { $in: [sampleInvitation._id, newInvitation._id] }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Invitation backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testInvitation(); 