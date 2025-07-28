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

    const posts = await Post.find({ author: userId })
      .populate('author', 'name avatar username')
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
      author: userId,
      'media.type': 'image'
    })
      .populate('author', 'name avatar username')
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