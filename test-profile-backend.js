const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testGetMyProfile = async () => {
  console.log('\n👤 Testing Get My Profile...');
  try {
    const profile = await makeAuthRequest('GET', '/users/profile/me');
    console.log('✅ Get my profile successful');
    console.log('Profile data:', {
      name: profile.name,
      username: profile.username,
      avatar: profile.avatar,
      coverPhoto: profile.coverPhoto,
      bio: profile.bio,
      followers: profile.followers,
      following: profile.following
    });
    return profile;
  } catch (error) {
    console.log('❌ Get my profile failed');
    return null;
  }
};

const testUpdateProfile = async () => {
  console.log('\n✏️ Testing Update Profile...');
  try {
    const updateData = {
      bio: 'This is my updated bio from test script',
      location: 'Test City',
      website: 'https://testwebsite.com',
      workplace: 'Test Company',
      gender: 'Other'
    };

    const result = await makeAuthRequest('PUT', '/users/profile/update', updateData);
    console.log('✅ Update profile successful');
    console.log('Updated user data:', result.user);
    return result;
  } catch (error) {
    console.log('❌ Update profile failed');
    return null;
  }
};

const testUpdateProfilePhoto = async () => {
  console.log('\n📸 Testing Update Profile Photo...');
  try {
    const photoData = {
      photoUrl: '/uploads/profile-photos/test-profile-photo.jpg'
    };

    const result = await makeAuthRequest('PUT', '/users/profile/photo', photoData);
    console.log('✅ Update profile photo successful');
    console.log('New avatar:', result.avatar);
    return result;
  } catch (error) {
    console.log('❌ Update profile photo failed');
    return null;
  }
};

const testUpdateCoverPhoto = async () => {
  console.log('\n🖼️ Testing Update Cover Photo...');
  try {
    const coverData = {
      coverUrl: '/uploads/cover-photos/test-cover-photo.jpg'
    };

    const result = await makeAuthRequest('PUT', '/users/profile/cover', coverData);
    console.log('✅ Update cover photo successful');
    console.log('New cover photo:', result.coverPhoto);
    return result;
  } catch (error) {
    console.log('❌ Update cover photo failed');
    return null;
  }
};

const testGetUserActivity = async () => {
  console.log('\n📊 Testing Get User Activity...');
  try {
    const activity = await makeAuthRequest('GET', '/users/activity?page=1&limit=5');
    console.log('✅ Get user activity successful');
    console.log('Activity data:', {
      totalPosts: activity.totalPosts,
      totalLikedPosts: activity.totalLikedPosts,
      totalAlbums: activity.totalAlbums,
      postsCount: activity.posts?.length || 0,
      likedPostsCount: activity.likedPosts?.length || 0,
      albumsCount: activity.albums?.length || 0
    });
    return activity;
  } catch (error) {
    console.log('❌ Get user activity failed');
    return null;
  }
};

const testSearchUsers = async () => {
  console.log('\n🔍 Testing Search Users...');
  try {
    const users = await makeAuthRequest('GET', '/users/search?q=test');
    console.log('✅ Search users successful');
    console.log(`Found ${users.length} users`);
    return users;
  } catch (error) {
    console.log('❌ Search users failed');
    return null;
  }
};

const testGetSuggestedUsers = async () => {
  console.log('\n👥 Testing Get Suggested Users...');
  try {
    const users = await makeAuthRequest('GET', '/users/suggested');
    console.log('✅ Get suggested users successful');
    console.log(`Found ${users.length} suggested users`);
    return users;
  } catch (error) {
    console.log('❌ Get suggested users failed');
    return null;
  }
};

const testGetUserById = async (userId) => {
  console.log('\n👤 Testing Get User By ID...');
  try {
    const user = await makeAuthRequest('GET', `/users/${userId}`);
    console.log('✅ Get user by ID successful');
    console.log('User data:', {
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      isFollowing: user.isFollowing,
      isBlocked: user.isBlocked
    });
    return user;
  } catch (error) {
    console.log('❌ Get user by ID failed');
    return null;
  }
};

const testFollowUser = async (userId) => {
  console.log('\n➕ Testing Follow User...');
  try {
    const result = await makeAuthRequest('POST', `/users/${userId}/follow`);
    console.log('✅ Follow user successful');
    console.log('Result:', result.message);
    return result;
  } catch (error) {
    console.log('❌ Follow user failed');
    return null;
  }
};

const testBlockUser = async (userId) => {
  console.log('\n🚫 Testing Block User...');
  try {
    const result = await makeAuthRequest('POST', `/users/${userId}/block`);
    console.log('✅ Block user successful');
    console.log('Result:', result.message);
    return result;
  } catch (error) {
    console.log('❌ Block user failed');
    return null;
  }
};

const testGetUserPosts = async (userId) => {
  console.log('\n📝 Testing Get User Posts...');
  try {
    const posts = await makeAuthRequest('GET', `/users/${userId}/posts`);
    console.log('✅ Get user posts successful');
    console.log(`Found ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.log('❌ Get user posts failed');
    return null;
  }
};

const testGetUserAlbums = async (userId) => {
  console.log('\n📚 Testing Get User Albums...');
  try {
    const albums = await makeAuthRequest('GET', `/users/${userId}/albums`);
    console.log('✅ Get user albums successful');
    console.log(`Found ${albums.length} albums`);
    return albums;
  } catch (error) {
    console.log('❌ Get user albums failed');
    return null;
  }
};

const testGetUserFollowers = async (userId) => {
  console.log('\n👥 Testing Get User Followers...');
  try {
    const followers = await makeAuthRequest('GET', `/users/${userId}/followers`);
    console.log('✅ Get user followers successful');
    console.log(`Found ${followers.length} followers`);
    return followers;
  } catch (error) {
    console.log('❌ Get user followers failed');
    return null;
  }
};

const testGetUserFollowing = async (userId) => {
  console.log('\n👥 Testing Get User Following...');
  try {
    const following = await makeAuthRequest('GET', `/users/${userId}/following`);
    console.log('✅ Get user following successful');
    console.log(`Found ${following.length} following`);
    return following;
  } catch (error) {
    console.log('❌ Get user following failed');
    return null;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Profile Backend Tests...\n');

  // Test login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test profile-related endpoints
  await testGetMyProfile();
  await testUpdateProfile();
  await testUpdateProfilePhoto();
  await testUpdateCoverPhoto();
  await testGetUserActivity();

  // Test user search and suggestions
  await testSearchUsers();
  await testGetSuggestedUsers();

  // Test user interactions (using a test user ID - you'll need to replace this)
  const testUserId = '507f1f77bcf86cd799439011'; // Replace with actual user ID
  await testGetUserById(testUserId);
  await testFollowUser(testUserId);
  await testBlockUser(testUserId);
  await testGetUserPosts(testUserId);
  await testGetUserAlbums(testUserId);
  await testGetUserFollowers(testUserId);
  await testGetUserFollowing(testUserId);

  console.log('\n✅ All tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testLogin,
  testGetMyProfile,
  testUpdateProfile,
  testUpdateProfilePhoto,
  testUpdateCoverPhoto,
  testGetUserActivity,
  testSearchUsers,
  testGetSuggestedUsers,
  testGetUserById,
  testFollowUser,
  testBlockUser,
  testGetUserPosts,
  testGetUserAlbums,
  testGetUserFollowers,
  testGetUserFollowing
}; 