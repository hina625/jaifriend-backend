const User = require('../models/user');
const Post = require('../models/post');
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

module.exports = {
  getDashboardStats,
  getUsers,
  getPosts,
  getComments,
  getGroups,
  getPages,
  getGames,
  getMessages
}; 