const User = require('../models/user');
const Post = require('../models/post');
const Album = require('../models/album');
const Group = require('../models/group');
const Page = require('../models/page');
const Game = require('../models/game');
const Message = require('../models/message');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts with error handling for models that might not exist
    const totalUsers = await User.countDocuments().catch(() => 0);
    const totalPosts = await Post.countDocuments().catch(() => 0);
    const totalPages = await Page.countDocuments().catch(() => 0);
    const totalGroups = await Group.countDocuments().catch(() => 0);
    const totalGames = await Game.countDocuments().catch(() => 0);
    const totalMessages = await Message.countDocuments().catch(() => 0);

    // Get online users (users active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.countDocuments({
      lastActive: { $gte: fiveMinutesAgo }
    }).catch(() => 0);

    // Get total comments (assuming comments are stored in posts)
    const postsWithComments = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } }
        }
      }
    ]).catch(() => []);
    const totalComments = postsWithComments.length > 0 ? postsWithComments[0].totalComments : 0;

    // Get monthly statistics for chart
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Post.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          posts: { $sum: 1 },
          users: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          month: "$_id",
          posts: 1,
          users: { $size: "$users" }
        }
      },
      { $sort: { month: 1 } }
    ]).catch(() => []);

    // Format monthly stats for chart
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyStats.find(stat => stat.month === i + 1);
      return {
        month: i + 1,
        posts: monthData ? monthData.posts : 0,
        users: monthData ? monthData.users : 0
      };
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalPages,
        totalGroups,
        totalGames,
        totalMessages,
        onlineUsers,
        totalComments
      },
      chartData
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// Get users with pagination
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// Get posts with pagination
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: page * limit < totalPosts,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts'
    });
  }
};

// Get comments
const getComments = async (req, res) => {
  try {
    const posts = await Post.find({ 'comments.0': { $exists: true } })
      .populate('userId', 'name email avatar')
      .populate('comments.userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const allComments = posts.reduce((acc, post) => {
      const postComments = post.comments.map(comment => ({
        ...comment.toObject(),
        postId: post._id,
        postContent: post.content.substring(0, 100) + '...'
      }));
      return acc.concat(postComments);
    }, []);

    res.json({
      success: true,
      comments: allComments,
      totalComments: allComments.length
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// Get groups
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      groups,
      totalGroups: groups.length
    });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups'
    });
  }
};

// Get pages
const getPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pages,
      totalPages: pages.length
    });
  } catch (error) {
    console.error('Error getting pages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pages'
    });
  }
};

// Get games
const getGames = async (req, res) => {
  try {
    const games = await Game.find()
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      games,
      totalGames: games.length
    });
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching games'
    });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .populate('senderId', 'name email avatar')
      .populate('receiverId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments();

    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasNextPage: page * limit < totalMessages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Verify user
const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User verified successfully',
      user
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user'
    });
  }
};

// Unverify user
const unverifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User unverified successfully',
      user
    });
  } catch (error) {
    console.error('Error unverifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unverifying user'
    });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
      user
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user'
    });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User unblocked successfully',
      user
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Also delete related data (posts, albums, etc.)
    await Post.deleteMany({ author: userId });
    await Album.deleteMany({ user: userId });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// Bulk actions
const bulkAction = async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'verify':
        updateData = { isVerified: true };
        message = 'Users verified successfully';
        break;
      case 'unverify':
        updateData = { isVerified: false };
        message = 'Users unverified successfully';
        break;
      case 'block':
        updateData = { isBlocked: true };
        message = 'Users blocked successfully';
        break;
      case 'unblock':
        updateData = { isBlocked: false };
        message = 'Users unblocked successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    res.json({
      success: true,
      message,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk action'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // Active users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsersThisWeek = await User.countDocuments({
      lastActive: { $gte: weekAgo }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        onlineUsers,
        verifiedUsers,
        blockedUsers,
        newUsersToday,
        activeUsersThisWeek
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
};

// Get online users with session information
const getOnlineUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'lastActive';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Get users who are currently online (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineUsers = await User.find({
      lastActive: { $gte: fiveMinutesAgo }
    })
    .select('-password')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

    const totalOnlineUsers = await User.countDocuments({
      lastActive: { $gte: fiveMinutesAgo }
    });

    // Enhance user data with session information
    const enhancedUsers = onlineUsers.map(user => ({
      _id: user._id,
      id: user._id.toString().slice(-8), // Short ID
      username: user.username,
      email: user.email,
      source: 'web', // Default source, can be enhanced with actual session data
      ipAddress: req.ip || 'Unknown', // Get IP from request
      status: user.isOnline ? 'online' : 'away',
      lastActive: user.lastActive,
      userAgent: req.headers['user-agent'] || 'Unknown',
      sessionId: user._id.toString() // Simple session ID
    }));

    res.json({
      success: true,
      users: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOnlineUsers / limit),
        totalUsers: totalOnlineUsers,
        hasNextPage: page * limit < totalOnlineUsers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
};

// Kick user (force logout)
const kickUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isOnline: false,
        lastActive: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User kicked successfully',
      user
    });
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error kicking user'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getPosts,
  getComments,
  getGroups,
  getPages,
  getGames,
  getMessages,
  verifyUser,
  unverifyUser,
  blockUser,
  unblockUser,
  deleteUser,
  bulkAction,
  getUserStats,
  getOnlineUsers,
  kickUser
}; 