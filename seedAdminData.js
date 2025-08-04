const mongoose = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const Group = require('./models/group');
const Page = require('./models/page');
const Game = require('./models/game');
const Message = require('./models/message');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jaifriend', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedAdminData = async () => {
  try {
    console.log('🌱 Seeding admin dashboard data...');

    // Get existing users
    const users = await User.find().limit(10);
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    const userId = users[0]._id;

    // Create sample posts
    const posts = [];
    for (let i = 0; i < 20; i++) {
      posts.push({
        content: `Sample post ${i + 1} - This is a test post for admin dashboard statistics.`,
        userId: users[i % users.length]._id,
        likes: Math.floor(Math.random() * 50),
        comments: [
          {
            userId: users[(i + 1) % users.length]._id,
            content: `Sample comment ${i + 1}`,
            createdAt: new Date()
          }
        ],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date in last year
      });
    }

    await Post.insertMany(posts);
    console.log('✅ Created 20 sample posts');

    // Create sample groups
    const groups = [
      {
        name: 'Tech Enthusiasts',
        description: 'A group for technology lovers',
        createdBy: userId,
        members: users.slice(0, 5).map(u => u._id)
      },
      {
        name: 'Photography Club',
        description: 'Share your best photos',
        createdBy: userId,
        members: users.slice(0, 3).map(u => u._id)
      }
    ];

    await Group.insertMany(groups);
    console.log('✅ Created 2 sample groups');

    // Create sample pages
    const pages = [
      {
        title: 'About Us',
        content: 'Learn more about our platform',
        createdBy: userId,
        isPublished: true
      },
      {
        title: 'Privacy Policy',
        content: 'Our privacy policy',
        createdBy: userId,
        isPublished: true
      }
    ];

    await Page.insertMany(pages);
    console.log('✅ Created 2 sample pages');

    // Create sample games
    const games = [
      {
        name: 'Memory Match',
        description: 'Test your memory with this fun game',
        category: 'Puzzle',
        difficulty: 'Easy',
        createdBy: userId
      },
      {
        name: 'Word Scramble',
        description: 'Unscramble the words',
        category: 'Puzzle',
        difficulty: 'Medium',
        createdBy: userId
      }
    ];

    await Game.insertMany(games);
    console.log('✅ Created 2 sample games');

    // Create sample messages
    const messages = [];
    for (let i = 0; i < 15; i++) {
      messages.push({
        senderId: users[i % users.length]._id,
        receiverId: users[(i + 1) % users.length]._id,
        content: `Sample message ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });
    }

    await Message.insertMany(messages);
    console.log('✅ Created 15 sample messages');

    // Update some users to be online (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await User.updateMany(
      { _id: { $in: users.slice(0, 3).map(u => u._id) } },
      { lastActive: new Date() }
    );
    console.log('✅ Updated 3 users as online');

    console.log('🎉 Admin dashboard data seeded successfully!');
    console.log('📊 You can now view real statistics in the admin dashboard.');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedAdminData(); 