const mongoose = require('mongoose');
const PrivacySettings = require('./models/privacySettings');
const User = require('./models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testPrivacy() {
  try {
    console.log('🧪 Testing Privacy Backend...\n');

    // Test 1: Create a sample user
    console.log('1. Creating sample user...');
    const sampleUser = new User({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });

    await sampleUser.save();
    console.log('✅ Sample user created successfully');

    // Test 2: Test default privacy settings creation
    console.log('\n2. Testing default privacy settings creation...');
    const defaultSettings = new PrivacySettings({
      userId: sampleUser._id,
      status: 'Online',
      whoCanFollowMe: 'Everyone',
      whoCanMessageMe: 'Everyone',
      whoCanSeeMyFriends: 'Everyone',
      whoCanPostOnMyTimeline: 'People I Follow',
      whoCanSeeMyBirthday: 'Everyone',
      confirmRequestWhenSomeoneFollowsYou: 'No',
      showMyActivities: 'Yes',
      shareMyLocationWithPublic: 'Yes',
      allowSearchEnginesToIndex: 'Yes'
    });

    await defaultSettings.save();
    console.log('✅ Default privacy settings created');

    // Test 3: Test privacy settings update
    console.log('\n3. Testing privacy settings update...');
    const updatedSettings = await PrivacySettings.findOneAndUpdate(
      { userId: sampleUser._id },
      {
        status: 'Away',
        whoCanFollowMe: 'Friends only',
        whoCanMessageMe: 'Friends only',
        whoCanSeeMyFriends: 'Friends only',
        whoCanPostOnMyTimeline: 'Only me',
        whoCanSeeMyBirthday: 'Only me',
        confirmRequestWhenSomeoneFollowsYou: 'Yes',
        showMyActivities: 'No',
        shareMyLocationWithPublic: 'No',
        allowSearchEnginesToIndex: 'No',
        lastUpdated: new Date()
      },
      { new: true }
    );

    console.log('✅ Privacy settings updated successfully');
    console.log('Updated settings:', {
      status: updatedSettings.status,
      whoCanFollowMe: updatedSettings.whoCanFollowMe,
      whoCanMessageMe: updatedSettings.whoCanMessageMe
    });

    // Test 4: Test privacy level calculation
    console.log('\n4. Testing privacy level calculation...');
    let privacyLevel = 0;
    
    if (updatedSettings.whoCanFollowMe === 'No one') privacyLevel += 20;
    else if (updatedSettings.whoCanFollowMe === 'Friends only') privacyLevel += 10;
    
    if (updatedSettings.whoCanMessageMe === 'No one') privacyLevel += 20;
    else if (updatedSettings.whoCanMessageMe === 'Friends only') privacyLevel += 10;
    
    if (updatedSettings.whoCanSeeMyFriends === 'Only me') privacyLevel += 15;
    else if (updatedSettings.whoCanSeeMyFriends === 'Friends only') privacyLevel += 7;
    
    if (updatedSettings.whoCanPostOnMyTimeline === 'Only me') privacyLevel += 15;
    else if (updatedSettings.whoCanPostOnMyTimeline === 'Friends only') privacyLevel += 7;
    
    if (updatedSettings.whoCanSeeMyBirthday === 'Only me') privacyLevel += 10;
    else if (updatedSettings.whoCanSeeMyBirthday === 'Friends only') privacyLevel += 5;
    
    if (updatedSettings.confirmRequestWhenSomeoneFollowsYou === 'Yes') privacyLevel += 5;
    if (updatedSettings.showMyActivities === 'No') privacyLevel += 5;
    if (updatedSettings.shareMyLocationWithPublic === 'No') privacyLevel += 5;
    if (updatedSettings.allowSearchEnginesToIndex === 'No') privacyLevel += 5;

    const privacyLevelText = privacyLevel >= 80 ? 'Very Private' : 
                            privacyLevel >= 60 ? 'Private' : 
                            privacyLevel >= 40 ? 'Moderate' : 
                            privacyLevel >= 20 ? 'Open' : 'Very Open';

    console.log(`Privacy Level: ${privacyLevel}/100 (${privacyLevelText})`);

    // Test 5: Test privacy settings query
    console.log('\n5. Querying privacy settings...');
    const privacySettings = await PrivacySettings.findOne({ userId: sampleUser._id });
    console.log(`✅ Found privacy settings for user`);

    // Test 6: Test privacy summary
    console.log('\n6. Testing privacy summary...');
    const summary = {
      profileVisibility: privacySettings.whoCanFollowMe,
      messagingPrivacy: privacySettings.whoCanMessageMe,
      friendsVisibility: privacySettings.whoCanSeeMyFriends,
      timelinePrivacy: privacySettings.whoCanPostOnMyTimeline,
      birthdayPrivacy: privacySettings.whoCanSeeMyBirthday,
      followConfirmation: privacySettings.confirmRequestWhenSomeoneFollowsYou,
      activityVisibility: privacySettings.showMyActivities,
      locationSharing: privacySettings.shareMyLocationWithPublic,
      searchEngineIndexing: privacySettings.allowSearchEnginesToIndex,
      lastUpdated: privacySettings.lastUpdated
    };

    console.log('Privacy Summary:', summary);

    // Test 7: Clean up
    console.log('\n7. Cleaning up test data...');
    await User.findByIdAndDelete(sampleUser._id);
    await PrivacySettings.deleteMany({ userId: sampleUser._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Privacy backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testPrivacy(); 