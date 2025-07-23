const mongoose = require('mongoose');
const Post = require('./models/post');
require('dotenv').config();

async function createTestPost() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test post
    const testPost = new Post({
      user: {
        name: "Test User",
        avatar: "/avatars/1.png.png",
        userId: "507f1f77bcf86cd799439011" // dummy ObjectId
      },
      content: "This is my first post! 🎉 Welcome to our social platform. I'm excited to share my thoughts and connect with everyone here. Let's make this community amazing! #firstpost #excited",
      likes: ["507f1f77bcf86cd799439011"], // Add a like
      comments: [
        {
          user: {
            name: "Friend User",
            avatar: "/avatars/2.png.png",
            userId: "507f1f77bcf86cd799439012"
          },
          text: "Welcome! Great to have you here! 👋",
          createdAt: new Date()
        },
        {
          user: {
            name: "Community Member",
            avatar: "/avatars/3.png.png",
            userId: "507f1f77bcf86cd799439013"
          },
          text: "Awesome first post! Looking forward to more content from you! 🚀",
          createdAt: new Date()
        }
      ],
      views: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"], // Add some views
      media: [
        {
          url: "/uploads/test-image.jpg",
          type: "image",
          uploadedAt: new Date()
        }
      ],
      createdAt: new Date()
    });

    await testPost.save();
    console.log('✅ Test post created successfully!');
    console.log('Post ID:', testPost._id);
    console.log('Content:', testPost.content);
    console.log('Likes:', testPost.likes.length);
    console.log('Comments:', testPost.comments.length);
    console.log('Views:', testPost.views.length);

    // Create a second test post with more engagement
    const popularPost = new Post({
      user: {
        name: "Viral Creator",
        avatar: "/avatars/4.png.png",
        userId: "507f1f77bcf86cd799439014"
      },
      content: "🚀 This post is going VIRAL! Check out this amazing content that everyone loves! This is exactly the kind of post that should appear at the TOP of the popular section. #viral #trending #popular #engagement",
      likes: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017", "507f1f77bcf86cd799439018"], // 8 likes
      comments: [
        {
          user: {
            name: "Fan 1",
            avatar: "/avatars/5.png.png",
            userId: "507f1f77bcf86cd799439016"
          },
          text: "This is absolutely amazing! 🔥",
          createdAt: new Date()
        },
        {
          user: {
            name: "Fan 2",
            avatar: "/avatars/6.png.png",
            userId: "507f1f77bcf86cd799439017"
          },
          text: "Can't stop watching this! 👀",
          createdAt: new Date()
        },
        {
          user: {
            name: "Fan 3",
            avatar: "/avatars/7.png.png",
            userId: "507f1f77bcf86cd799439018"
          },
          text: "This needs to go viral! 🚀",
          createdAt: new Date()
        },
        {
          user: {
            name: "Fan 4",
            avatar: "/avatars/8.png.png",
            userId: "507f1f77bcf86cd799439019"
          },
          text: "Best content I've seen today! 💯",
          createdAt: new Date()
        },
        {
          user: {
            name: "Fan 5",
            avatar: "/avatars/9.png.png",
            userId: "507f1f77bcf86cd799439020"
          },
          text: "This is trending everywhere! 🌟",
          createdAt: new Date()
        },
        {
          user: {
            name: "Fan 6",
            avatar: "/avatars/10.png.png",
            userId: "507f1f77bcf86cd799439021"
          },
          text: "Can't believe how good this is! 😍",
          createdAt: new Date()
        }
      ],
      views: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017", "507f1f77bcf86cd799439018", "507f1f77bcf86cd799439019", "507f1f77bcf86cd799439020"], // 10 views
      media: [
        {
          url: "/uploads/popular-image.jpg",
          type: "image",
          uploadedAt: new Date()
        }
      ],
      createdAt: new Date()
    });

    // Create a third test post with medium engagement
    const mediumPost = new Post({
      user: {
        name: "Regular User",
        avatar: "/avatars/11.png.png",
        userId: "507f1f77bcf86cd799439022"
      },
      content: "This is a regular post with some engagement. It has a few likes and comments, but not as much as the viral post above. Still good content though! 👍",
      likes: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"], // 3 likes
      comments: [
        {
          user: {
            name: "Friend 1",
            avatar: "/avatars/12.png.png",
            userId: "507f1f77bcf86cd799439023"
          },
          text: "Nice post! 👍",
          createdAt: new Date()
        },
        {
          user: {
            name: "Friend 2",
            avatar: "/avatars/13.png.png",
            userId: "507f1f77bcf86cd799439024"
          },
          text: "Good content! 👌",
          createdAt: new Date()
        }
      ],
      views: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"], // 4 views
      createdAt: new Date()
    });

    await popularPost.save();
    console.log('✅ Popular test post created successfully!');
    console.log('Post ID:', popularPost._id);
    console.log('Content:', popularPost.content);
    console.log('Likes:', popularPost.likes.length);
    console.log('Comments:', popularPost.comments.length);
    console.log('Views:', popularPost.views.length);

    await mediumPost.save();
    console.log('✅ Medium engagement test post created successfully!');
    console.log('Post ID:', mediumPost._id);
    console.log('Content:', mediumPost.content);
    console.log('Likes:', mediumPost.likes.length);
    console.log('Comments:', mediumPost.comments.length);
    console.log('Views:', mediumPost.views.length);

    console.log('\n🎉 Test posts created! Now check your popular posts page.');
    console.log('📊 Expected order:');
    console.log('1. Viral Creator (Score: 24) - 8 likes + 6 comments + 10 views');
    console.log('2. Test User (Score: 6) - 1 like + 2 comments + 3 views');
    console.log('3. Regular User (Score: 9) - 3 likes + 2 comments + 4 views');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test post:', error);
    process.exit(1);
  }
}

createTestPost(); 