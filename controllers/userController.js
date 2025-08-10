const User = require('../models/user');
const Post = require('../models/post');
const Album = require('../models/album');

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(id)
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    let isBlocked = false;
    
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      isFollowing = currentUser?.following?.includes(id) || false;
      isBlocked = currentUser?.blockedUsers?.includes(id) || false;
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: id });
    
    // Get user's albums count
    const albumsCount = await Album.countDocuments({ user: id });

    // Get user's posts count by type
    const postsWithMedia = await Post.find({ author: id });
    const photosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'image')
    ).length;
    const videosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'video')
    ).length;

    const userData = {
      id: user._id,
      name: user.name || user.fullName || 'User',
      username: user.username || `@${user._id.toString().slice(-8)}`,
      avatar: user.avatar || '/avatars/1.png.png',
      coverPhoto: user.coverPhoto || '/covers/default-cover.jpg',
      workplace: user.workplace,
      country: user.country,
      address: user.address,
      gender: user.gender,
      bio: user.bio,
      status: user.status,
      location: user.location,
      website: user.website,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      following: user.following?.length || 0,
      followers: user.followers?.length || 0,
      posts: postsCount,
      albums: albumsCount,
      photos: photosCount,
      videos: videosCount,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isPrivate: user.isPrivate || false,
      isVerified: user.isVerified || false,
      isFollowing,
      isBlocked,
      followingList: user.following || [],
      followersList: user.followers || []
    };

    res.json(userData);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Follow/Unfollow user
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (currentUserId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: currentUserId }
      });
      res.json({ message: 'Unfollowed successfully', isFollowing: false, currentUserId });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: currentUserId }
      });
      
      // Create notification for the user being followed
      const { createNotification } = require('./notificationController');
      
      await createNotification({
        userId: userId,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.name} started following you`,
        relatedUserId: currentUserId
      });
      
      res.json({ message: 'Followed successfully', isFollowing: true, currentUserId });
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Block/Unblock user
exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (currentUserId === userId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isBlocked = currentUser.blockedUsers?.includes(userId) || false;

    if (isBlocked) {
      // Unblock
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: userId }
      });
      res.json({ message: 'User unblocked successfully', isBlocked: false });
    } else {
      // Block
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: userId }
      });
      res.json({ message: 'User blocked successfully', isBlocked: true });
    }
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user?.id;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    
    let query = {
      $or: [
        { name: searchRegex },
        { fullName: searchRegex },
        { username: searchRegex },
        { bio: searchRegex }
      ]
    };

    // Exclude blocked users and current user
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser?.blockedUsers?.length > 0) {
        query._id = { 
          $nin: [...currentUser.blockedUsers, currentUserId] 
        };
      } else {
        query._id = { $ne: currentUserId };
      }
    }

    const users = await User.find(query)
      .select('name fullName username avatar bio isOnline lastSeen')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const posts = await Post.find({ 
      $or: [
        { userId: userId },
        { 'user.userId': userId }
      ]
    })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's albums
exports.getUserAlbums = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const albums = await Album.find({ user: userId })
      .populate('user', 'name avatar username')
      .sort({ createdAt: -1 });

    res.json(albums);
  } catch (error) {
    console.error('Error getting user albums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's products
exports.getUserProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const Product = require('../models/product');
    const products = await Product.find({ seller: userId })
      .populate('seller', 'name avatar username')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Error getting user products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's photos
exports.getUserPhotos = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const posts = await Post.find({ 
      $or: [
        { userId: userId },
        { 'user.userId': userId }
      ],
      'media.type': 'image'
    })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error getting user photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's videos
exports.getUserVideos = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const posts = await Post.find({ 
      author: userId,
      'media.type': 'video'
    })
      .populate('author', 'name avatar username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error getting user videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's friends (mutual followers)
exports.getUserFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const user = await User.findById(userId)
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find mutual followers (friends)
    const followingIds = user.following.map(f => f._id.toString());
    const followersIds = user.followers.map(f => f._id.toString());
    const friendsIds = followingIds.filter(id => followersIds.includes(id));

    const friends = user.following.filter(following => 
      friendsIds.includes(following._id.toString())
    );

    res.json(friends);
  } catch (error) {
    console.error('Error getting user friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's followers
exports.getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const user = await User.findById(userId)
      .populate('followers', 'name avatar username bio isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.followers || []);
  } catch (error) {
    console.error('Error getting user followers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's following
exports.getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is blocked by target user
    if (currentUserId) {
      const targetUser = await User.findById(userId);
      if (targetUser?.blockedUsers?.includes(currentUserId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const user = await User.findById(userId)
      .populate('following', 'name avatar username bio isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.following || []);
  } catch (error) {
    console.error('Error getting user following:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user's following (for sidebar)
exports.getMyFollowing = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(currentUserId)
      .populate('following', 'name avatar username bio isOnline lastSeen isVerified');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format the data for the sidebar
    const followingList = (user.following || []).map(followedUser => ({
      id: followedUser._id,
      name: followedUser.name || followedUser.fullName || 'User',
      username: followedUser.username || `@${followedUser._id.toString().slice(-8)}`,
      avatar: followedUser.avatar || '/avatars/1.png.png',
      isOnline: followedUser.isOnline || false,
      isVerified: followedUser.isVerified || false
    }));

    res.json(followingList);
  } catch (error) {
    console.error('Error getting current user following:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get suggested users to follow
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = await User.findById(currentUserId);
    
    // Get users that the current user is not following and not blocked
    const excludedUsers = [
      currentUserId,
      ...(currentUser.following || []),
      ...(currentUser.blockedUsers || [])
    ];

    const suggestedUsers = await User.find({
      _id: { $nin: excludedUsers },
      isPrivate: false
    })
      .select('name fullName username avatar bio isOnline lastSeen')
      .limit(10);

    res.json(suggestedUsers);
  } catch (error) {
    console.error('Error getting suggested users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 

// Update profile photo
exports.updateProfilePhoto = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { photoUrl } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile photo
    user.avatar = photoUrl;
    await user.save();

    res.json({ 
      message: 'Profile photo updated successfully', 
      avatar: user.avatar 
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update cover photo
exports.updateCoverPhoto = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { coverUrl } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!coverUrl) {
      return res.status(400).json({ error: 'Cover photo URL is required' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update cover photo
    user.coverPhoto = coverUrl;
    await user.save();

    res.json({ 
      message: 'Cover photo updated successfully', 
      coverPhoto: user.coverPhoto 
    });
  } catch (error) {
    console.error('Error updating cover photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile information
exports.updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const {
      name,
      fullName,
      bio,
      status,
      location,
      website,
      workplace,
      country,
      address,
      gender,
      dateOfBirth,
      phone
    } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (status !== undefined) user.status = status;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (workplace !== undefined) user.workplace = workplace;
    if (country !== undefined) user.country = country;
    if (address !== undefined) user.address = address;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: user._id,
        name: user.name || user.fullName,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        status: user.status,
        location: user.location,
        website: user.website,
        workplace: user.workplace,
        country: user.country,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's profile information (current user)
exports.getMyProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(currentUserId)
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: currentUserId });
    
    // Get user's albums count
    const albumsCount = await Album.countDocuments({ user: currentUserId });

    // Get user's posts count by type
    const postsWithMedia = await Post.find({ author: currentUserId });
    const photosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'image')
    ).length;
    const videosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'video')
    ).length;

    const userData = {
      id: user._id,
      name: user.name || user.fullName || 'User',
      fullName: user.fullName,
      username: user.username || `@${user._id.toString().slice(-8)}`,
      avatar: user.avatar || '/avatars/1.png.png',
      coverPhoto: user.coverPhoto || '/covers/default-cover.jpg',
      bio: user.bio,
      status: user.status,
      location: user.location,
      website: user.website,
      workplace: user.workplace,
      country: user.country,
      address: user.address,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      phone: user.phone,
      following: user.following?.length || 0,
      followers: user.followers?.length || 0,
      posts: postsCount,
      albums: albumsCount,
      photos: photosCount,
      videos: videosCount,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isPrivate: user.isPrivate || false,
      isVerified: user.isVerified || false,
      isSetupDone: user.isSetupDone || false,
      followingList: user.following || [],
      followersList: user.followers || []
    };

    res.json(userData);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { password } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required for account deletion' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password (you should implement proper password verification here)
    // For now, we'll just check if password exists
    if (!user.password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Delete user's posts
    await Post.deleteMany({ author: currentUserId });

    // Delete user's albums
    await Album.deleteMany({ user: currentUserId });

    // Remove user from other users' following/followers lists
    await User.updateMany(
      { following: currentUserId },
      { $pull: { following: currentUserId } }
    );

    await User.updateMany(
      { followers: currentUserId },
      { $pull: { followers: currentUserId } }
    );

    // Delete the user
    await User.findByIdAndDelete(currentUserId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's activity feed
exports.getUserActivity = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts, likes, comments, and follows
    const posts = await Post.find({ author: currentUserId })
      .populate('author', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get posts that user has liked
    const likedPosts = await Post.find({ 
      _id: { $in: user.likedPosts || [] }
    })
      .populate('author', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get user's albums
    const albums = await Album.find({ user: currentUserId })
      .populate('user', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const activity = {
      posts,
      likedPosts,
      albums,
      totalPosts: await Post.countDocuments({ author: currentUserId }),
      totalLikedPosts: user.likedPosts?.length || 0,
      totalAlbums: await Album.countDocuments({ user: currentUserId })
    };

    res.json(activity);
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle user verification status (admin only)
exports.toggleVerification = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if current user is admin (you should implement proper admin check)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser || !currentUser.isVerified) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({ 
      message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`,
      isVerified: user.isVerified 
    });
  } catch (error) {
    console.error('Error toggling verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 