const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Test if server is running
    console.log('Testing server connection...');
    const response = await axios.get('http://localhost:5000/');
    console.log('Server response:', response.data);

    // Test registration
    console.log('\nTesting user registration...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });
    console.log('Registration response:', registerResponse.data);

    // Test login
    console.log('\nTesting user login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log('Login response:', loginResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Utility: Delete all posts (run this manually if needed)
if (process.argv.includes('--delete-posts')) {
  const mongoose = require('mongoose');
  const Post = require('./models/post');
  require('dotenv').config();
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      const result = await Post.deleteMany({});
      console.log('Deleted posts:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

testAPI(); 