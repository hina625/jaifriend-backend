const mongoose = require('mongoose');
const Notification = require('./models/notification');
const User = require('./models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testNotification() {
  try {
    console.log('🧪 Testing Notification Backend...\n');

    // Test 1: Create a sample user with notification settings
    console.log('1. Creating sample user with notification settings...');
    const sampleUser = new User({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      notificationSettings: {
        someonelikedMyPosts: true,
        someoneCommentedOnMyPosts: false,
        someoneSharedOnMyPosts: true,
        someoneFollowedMe: true,
        someoneLikedMyPages: false,
        someoneVisitedMyProfile: true,
        someoneMentionedMe: true,
        someoneJoinedMyGroups: false,
        someoneAcceptedMyFriendRequest: true,
        someonePostedOnMyTimeline: false
      }
    });

    await sampleUser.save();
    console.log('✅ Sample user created successfully');

    // Test 2: Create sample notifications
    console.log('\n2. Creating sample notifications...');
    const sampleNotifications = [
      {
        userId: sampleUser._id,
        type: 'post_like',
        title: 'New Like',
        message: 'Someone liked your post',
        relatedUserId: new mongoose.Types.ObjectId()
      },
      {
        userId: sampleUser._id,
        type: 'follow',
        title: 'New Follower',
        message: 'Someone started following you',
        relatedUserId: new mongoose.Types.ObjectId()
      },
      {
        userId: sampleUser._id,
        type: 'post_comment',
        title: 'New Comment',
        message: 'Someone commented on your post',
        relatedUserId: new mongoose.Types.ObjectId(),
        isRead: true
      }
    ];

    const notifications = await Notification.insertMany(sampleNotifications);
    console.log(`✅ Created ${notifications.length} sample notifications`);

    // Test 3: Query notifications
    console.log('\n3. Querying notifications...');
    const userNotifications = await Notification.find({ userId: sampleUser._id });
    console.log(`✅ Found ${userNotifications.length} notifications for user`);

    // Test 4: Test statistics
    console.log('\n4. Testing notification statistics...');
    const unreadCount = await Notification.countDocuments({ 
      userId: sampleUser._id, 
      isRead: false 
    });
    console.log(`✅ Unread notifications: ${unreadCount}`);

    // Test 5: Test aggregation
    const typeStats = await Notification.aggregate([
      { $match: { userId: sampleUser._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('✅ Type statistics:', typeStats);

    // Test 6: Clean up
    console.log('\n5. Cleaning up test data...');
    await User.findByIdAndDelete(sampleUser._id);
    await Notification.deleteMany({ userId: sampleUser._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Notification backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testNotification(); 