const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jaifriend', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test users
const createTestUsers = async () => {
  try {
    // Check if test users already exist
    const existingUsers = await User.find({ username: { $in: ['testuser1', 'testuser2', 'testuser3'] } });
    if (existingUsers.length > 0) {
      console.log('Test users already exist, skipping creation');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUsers = [
      {
        email: 'john.doe@example.com',
        password: hashedPassword,
        name: 'John Doe',
        fullName: 'John Doe',
        username: 'testuser1',
        avatar: '/avatars/1.png.png',
        bio: 'Software Developer & Tech Enthusiast',
        isOnline: true,
        isVerified: false,
        isPrivate: false,
        followers: [],
        following: []
      },
      {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        name: 'Jane Smith',
        fullName: 'Jane Smith',
        username: 'testuser2',
        avatar: '/avatars/1.png.png',
        bio: 'Designer & Artist | Creating beautiful experiences',
        isOnline: false,
        isVerified: true,
        isPrivate: false,
        followers: [],
        following: []
      },
      {
        email: 'mike.johnson@example.com',
        password: hashedPassword,
        name: 'Mike Johnson',
        fullName: 'Mike Johnson',
        username: 'testuser3',
        avatar: '/avatars/1.png.png',
        bio: 'Photographer | Capturing moments that matter',
        isOnline: true,
        isVerified: false,
        isPrivate: false,
        followers: [],
        following: []
      },
      {
        email: 'sarah.wilson@example.com',
        password: hashedPassword,
        name: 'Sarah Wilson',
        fullName: 'Sarah Wilson',
        username: 'testuser4',
        avatar: '/avatars/1.png.png',
        bio: 'Content Creator | Sharing stories and experiences',
        isOnline: true,
        isVerified: true,
        isPrivate: false,
        followers: [],
        following: []
      },
      {
        email: 'alex.brown@example.com',
        password: hashedPassword,
        name: 'Alex Brown',
        fullName: 'Alex Brown',
        username: 'testuser5',
        avatar: '/avatars/1.png.png',
        bio: 'Entrepreneur | Building the future',
        isOnline: false,
        isVerified: false,
        isPrivate: false,
        followers: [],
        following: []
      }
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users:`);
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (@${user.username})`);
    });

  } catch (error) {
    console.error('Error creating test users:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createTestUsers();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUsers };
