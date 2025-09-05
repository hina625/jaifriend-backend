const User = require('../models/user');
const Post = require('../models/post');
const Group = require('../models/group');
const Album = require('../models/album');

// Get logged-in user's profile with posts
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log('🔍 getMyProfile called with userId:', userId);
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.userId:', req.userId);
    
    if (!userId) {
      console.log('❌ No userId found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('🔍 Looking for user with ID:', userId);
    
    // Get user with populated posts
    const user = await User.findById(userId)
      .populate({
        path: 'posts',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username')
      .select('-password');
    
    console.log('🔍 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found successfully:', user.name || user.username);

    // Calculate profile completion
    const completionItems = [
      { id: 'avatar', title: 'Add your profile picture', completed: !!user.avatar, icon: '📷' },
      { id: 'name', title: 'Add your name', completed: !!user.name, icon: '👤' },
      { id: 'workplace', title: 'Add your workplace', completed: !!user.workplace, icon: '💼' },
      { id: 'country', title: 'Add your country', completed: !!user.country, icon: '🌍' },
      { id: 'address', title: 'Add your address', completed: !!user.address, icon: '📍' },
      { id: 'bio', title: 'Add your bio', completed: !!user.bio, icon: '📝' },
      { id: 'phone', title: 'Add your phone', completed: !!user.phone, icon: '📱' },
      { id: 'dateOfBirth', title: 'Add your date of birth', completed: !!user.dateOfBirth, icon: '🎂' }
    ];

    const completedCount = completionItems.filter(item => item.completed).length;
    const totalCount = completionItems.length;
    const completionPercentage = Math.round((completedCount / totalCount) * 100);

    // Get user's albums count
    const albumsCount = await Album.countDocuments({ user: userId });

    // Get user's posts count by type
    const postsWithMedia = await Post.find({ author: userId });
    const photosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'image')
    ).length;
    const videosCount = postsWithMedia.filter(post => 
      post.media && post.media.some(media => media.type === 'video')
    ).length;

    // Get user images from UserImage model
    const UserImage = require('../models/userImage');
    const userImage = await UserImage.findOne({ userId: user._id });
    
    const profileData = {
      id: user._id,
      name: user.name || user.fullName || 'User',
      username: user.username || `@${user._id.toString().slice(-8)}`,
      avatar: userImage?.avatar || user.avatar || '/avatars/1.png.png',
      coverPhoto: userImage?.cover || user.coverPhoto || '/covers/default-cover.jpg',
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
      posts: user.posts?.length || 0,
      albums: albumsCount,
      photos: photosCount,
      videos: videosCount,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isPrivate: user.isPrivate || false,
      isVerified: user.isVerified || false,
      completionItems,
      completionPercentage,
      // Include actual posts data
      userPosts: user.posts || [],
      followingList: user.following || [],
      followersList: user.followers || []
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile by ID (for viewing other users)
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(id)
      .populate({
        path: 'posts',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      isFollowing = currentUser?.following?.includes(id) || false;
    }

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

    const profileData = {
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
      posts: user.posts?.length || 0,
      albums: albumsCount,
      photos: photosCount,
      videos: videosCount,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isPrivate: user.isPrivate || false,
      isVerified: user.isVerified || false,
      isFollowing,
      userPosts: user.posts || [],
      followingList: user.following || [],
      followersList: user.followers || []
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      name, 
      workplace, 
      country, 
      address, 
      gender, 
      bio, 
      status,
      location, 
      website,
      phone,
      dateOfBirth 
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (workplace !== undefined) updateData.workplace = workplace;
    if (country) updateData.country = country;
    if (address !== undefined) updateData.address = address;
    if (gender) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { avatar } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile picture updated successfully', avatar: user.avatar });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update cover photo
exports.updateCoverPhoto = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { coverPhoto } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!coverPhoto) {
      return res.status(400).json({ error: 'Cover photo is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { coverPhoto },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Cover photo updated successfully', coverPhoto: user.coverPhoto });
  } catch (error) {
    console.error('Error updating cover photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update status
exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Status updated successfully', status: user.status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Follow/Unfollow user
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId }
      });
      res.json({ message: 'Unfollowed successfully', following: false, currentUserId });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId }
      });
      
      // Create notification for the user being followed
      const { createNotification } = require('./notificationController');
      
      await createNotification({
        userId: targetUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.name} started following you`,
        relatedUserId: currentUserId
      });
      
      res.json({ message: 'Followed successfully', following: true, currentUserId });
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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

// Get user's photos (posts with images)
exports.getUserPhotos = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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

// Get user's videos (posts with videos)
exports.getUserVideos = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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

// Get user's saved posts
exports.getUserSavedPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate({
      path: 'savedPosts',
      populate: {
        path: 'author',
        select: 'name avatar username'
      }
    });

    res.json(user.savedPosts || []);
  } catch (error) {
    console.error('Error getting user saved posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { isOnline } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Online status updated', isOnline: user.isOnline });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get profile completion status
exports.getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const completionItems = [
      { id: 'avatar', title: 'Add your profile picture', completed: !!user.avatar, icon: '📷' },
      { id: 'name', title: 'Add your name', completed: !!user.name, icon: '👤' },
      { id: 'workplace', title: 'Add your workplace', completed: !!user.workplace, icon: '💼' },
      { id: 'country', title: 'Add your country', completed: !!user.country, icon: '🌍' },
      { id: 'address', title: 'Add your address', completed: !!user.address, icon: '📍' },
      { id: 'bio', title: 'Add your bio', completed: !!user.bio, icon: '📝' },
      { id: 'phone', title: 'Add your phone', completed: !!user.phone, icon: '📱' },
      { id: 'dateOfBirth', title: 'Add your date of birth', completed: !!user.dateOfBirth, icon: '🎂' }
    ];

    const completedCount = completionItems.filter(item => item.completed).length;
    const totalCount = completionItems.length;
    const completionPercentage = Math.round((completedCount / totalCount) * 100);

    res.json({
      completionItems,
      completedCount,
      totalCount,
      completionPercentage
    });
  } catch (error) {
    console.error('Error getting profile completion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 

// Get user's feed (posts from self and following)
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const user = await User.findById(userId);
    const followingIds = user.following || [];
    const ids = [userId, ...followingIds];
    const posts = await Post.find({ author: { $in: ids } })
      .populate('author', 'name avatar username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Like/unlike a post
exports.likePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.body;
    if (!userId || !postId) return res.status(400).json({ error: 'User or post ID missing' });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const user = await User.findById(userId);
    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes.pull(userId);
      user.likedPosts.pull(postId);
    } else {
      post.likes.push(userId);
      user.likedPosts.push(postId);
    }
    await post.save();
    await user.save();
    res.json({ liked: !alreadyLiked });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Join/leave a group
exports.joinGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.body;
    if (!userId || !groupId) return res.status(400).json({ error: 'User or group ID missing' });
    const user = await User.findById(userId);
    const alreadyJoined = user.groups.includes(groupId);
    if (alreadyJoined) {
      user.groups.pull(groupId);
    } else {
      user.groups.push(groupId);
    }
    await user.save();
    res.json({ joined: !alreadyJoined });
  } catch (error) {
    console.error('Error joining/leaving group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's groups
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const user = await User.findById(userId).populate('groups');
    res.json(user.groups);
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's liked posts
exports.getLikedPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const user = await User.findById(userId).populate({ path: 'likedPosts', populate: { path: 'author', select: 'name avatar username' } });
    res.json(user.likedPosts);
  } catch (error) {
    console.error('Error getting liked posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Block/Unblock user
exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isBlocked = currentUser.blockedUsers?.includes(targetUserId) || false;

    if (isBlocked) {
      // Unblock
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: targetUserId }
      });
      res.json({ message: 'User unblocked successfully', isBlocked: false });
    } else {
      // Block
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: targetUserId }
      });
      res.json({ message: 'User blocked successfully', isBlocked: true });
    }
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's friends (mutual followers)
exports.getFriends = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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
    console.error('Error getting friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 
