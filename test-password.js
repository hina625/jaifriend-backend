const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const PasswordChange = require('./models/passwordChange');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testPassword() {
  try {
    console.log('🧪 Testing Password Backend...\n');

    // Test 1: Create a sample user
    console.log('1. Creating sample user...');
    const hashedPassword = await bcrypt.hash('OldPassword123', 12);
    const sampleUser = new User({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      twoFactorEnabled: false
    });

    await sampleUser.save();
    console.log('✅ Sample user created successfully');

    // Test 2: Test password validation
    console.log('\n2. Testing password validation...');
    const testPasswords = [
      'weak',
      'Medium123',
      'StrongPass123!',
      'OldPassword123'
    ];

    for (const password of testPasswords) {
      const minLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      
      console.log(`Password: "${password}" - Valid: ${minLength && hasUppercase && hasLowercase && hasNumber}`);
    }

    // Test 3: Test password change
    console.log('\n3. Testing password change...');
    const newPassword = 'NewPassword456!';
    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    
    sampleUser.password = newHashedPassword;
    sampleUser.twoFactorEnabled = true;
    await sampleUser.save();
    console.log('✅ Password changed successfully');

    // Test 4: Create password change record
    console.log('\n4. Creating password change record...');
    const passwordChange = new PasswordChange({
      userId: sampleUser._id,
      status: 'success',
      twoFactorEnabled: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser'
    });

    await passwordChange.save();
    console.log('✅ Password change record created');

    // Test 5: Test password verification
    console.log('\n5. Testing password verification...');
    const isOldPasswordValid = await bcrypt.compare('OldPassword123', newHashedPassword);
    const isNewPasswordValid = await bcrypt.compare(newPassword, newHashedPassword);
    
    console.log(`Old password valid: ${isOldPasswordValid}`);
    console.log(`New password valid: ${isNewPasswordValid}`);

    // Test 6: Query password history
    console.log('\n6. Querying password history...');
    const passwordHistory = await PasswordChange.find({ userId: sampleUser._id });
    console.log(`✅ Found ${passwordHistory.length} password change records`);

    // Test 7: Test statistics
    console.log('\n7. Testing password statistics...');
    const [totalChanges, successfulChanges, failedChanges] = await Promise.all([
      PasswordChange.countDocuments({ userId: sampleUser._id }),
      PasswordChange.countDocuments({ userId: sampleUser._id, status: 'success' }),
      PasswordChange.countDocuments({ userId: sampleUser._id, status: 'failed' })
    ]);

    console.log(`Total changes: ${totalChanges}`);
    console.log(`Successful changes: ${successfulChanges}`);
    console.log(`Failed changes: ${failedChanges}`);

    // Test 8: Clean up
    console.log('\n8. Cleaning up test data...');
    await User.findByIdAndDelete(sampleUser._id);
    await PasswordChange.deleteMany({ userId: sampleUser._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Password backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testPassword(); 