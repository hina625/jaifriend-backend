const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-user-id'; // Replace with actual user ID for testing

// Test data for creating a reel
const testReelData = {
  title: 'Test Reel',
  description: 'This is a test reel for API testing',
  hashtags: ['test', 'api', 'reels'],
  duration: 15.5,
  category: 'general',
  privacy: 'everyone'
};

async function testReelsAPI() {
  console.log('🧪 Testing Reels API...\n');

  try {
    // Test 1: Get all reels
    console.log('1️⃣ Testing GET /reels');
    const response1 = await axios.get(`${BASE_URL}/reels`);
    console.log('✅ Success:', response1.data.reels.length, 'reels found');
    console.log('📊 Pagination:', response1.data.pagination);
    console.log('');

    // Test 2: Get trending reels
    console.log('2️⃣ Testing GET /reels/trending');
    const response2 = await axios.get(`${BASE_URL}/reels/trending`);
    console.log('✅ Success:', response2.data.length, 'trending reels found');
    console.log('');

    // Test 3: Get reels by category
    console.log('3️⃣ Testing GET /reels?category=general');
    const response3 = await axios.get(`${BASE_URL}/reels?category=general`);
    console.log('✅ Success:', response3.data.reels.length, 'general reels found');
    console.log('');

    // Test 4: Get reels by hashtag
    console.log('4️⃣ Testing GET /reels/hashtag/test');
    const response4 = await axios.get(`${BASE_URL}/reels/hashtag/test`);
    console.log('✅ Success:', response4.data.reels.length, 'reels with #test found');
    console.log('');

    console.log('🎉 All GET tests passed successfully!');
    console.log('');
    console.log('📝 Note: POST/PUT/DELETE tests require authentication');
    console.log('   To test those endpoints, you need to:');
    console.log('   1. Create a user account');
    console.log('   2. Get an authentication token');
    console.log('   3. Include the token in request headers');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
  }
}

// Test with authentication (uncomment and modify when you have auth set up)
async function testReelsAPIWithAuth() {
  console.log('🔐 Testing Reels API with Authentication...\n');

  const authToken = 'your-auth-token-here'; // Replace with actual token
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test creating a reel (requires file upload in real scenario)
    console.log('1️⃣ Testing POST /reels (create reel)');
    const createResponse = await axios.post(`${BASE_URL}/reels`, testReelData, { headers });
    console.log('✅ Reel created successfully:', createResponse.data._id);
    
    const reelId = createResponse.data._id;

    // Test updating a reel
    console.log('2️⃣ Testing PUT /reels/:id (update reel)');
    const updateData = { title: 'Updated Test Reel' };
    const updateResponse = await axios.put(`${BASE_URL}/reels/${reelId}`, updateData, { headers });
    console.log('✅ Reel updated successfully');

    // Test like/unlike
    console.log('3️⃣ Testing POST /reels/:id/like');
    const likeResponse = await axios.post(`${BASE_URL}/reels/${reelId}/like`, {}, { headers });
    console.log('✅ Like toggled successfully');

    // Test adding comment
    console.log('4️⃣ Testing POST /reels/:id/comment');
    const commentData = { text: 'Great reel!' };
    const commentResponse = await axios.post(`${BASE_URL}/reels/${reelId}/comment`, commentData, { headers });
    console.log('✅ Comment added successfully');

    // Test deleting the reel
    console.log('5️⃣ Testing DELETE /reels/:id');
    const deleteResponse = await axios.delete(`${BASE_URL}/reels/${reelId}`, { headers });
    console.log('✅ Reel deleted successfully');

    console.log('');
    console.log('🎉 All authenticated tests passed successfully!');

  } catch (error) {
    console.error('❌ Authenticated test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
  }
}

// Run tests
if (require.main === module) {
  testReelsAPI();
  
  // Uncomment to test authenticated endpoints
  // testReelsAPIWithAuth();
}

module.exports = { testReelsAPI, testReelsAPIWithAuth };
