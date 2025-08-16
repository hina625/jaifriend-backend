const User = require('../models/user');
const Post = require('../models/post');
const Album = require('../models/album');
const Group = require('../models/group');
const Event = require('../models/event');

// Unified search across all content types
exports.unifiedSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.userId;
    
    console.log('🔍 Unified search request:', { query: q, currentUserId });

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const results = {
      users: [],
      posts: [],
      albums: [],
      groups: [],
      events: []
    };

    // Search users
    try {
      let userQuery = {
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
          userQuery._id = { 
            $nin: [...currentUser.blockedUsers, currentUserId] 
          };
        } else {
          userQuery._id = { $ne: currentUserId };
        }
      }

      const users = await User.find(userQuery)
        .select('name fullName username avatar bio isOnline lastSeen')
        .limit(10);
      
      results.users = users;
      console.log('🔍 Found users:', users.length);
    } catch (error) {
      console.error('❌ Error searching users:', error);
    }

    // Search posts
    try {
      const posts = await Post.find({
        $or: [
          { content: searchRegex },
          { title: searchRegex }
        ],
        isPrivate: false
      })
      .populate('user', 'name username avatar')
      .select('content title user createdAt likes comments')
      .limit(10);
      
      results.posts = posts;
      console.log('🔍 Found posts:', posts.length);
    } catch (error) {
      console.error('❌ Error searching posts:', error);
    }

    // Search albums
    try {
      const albums = await Album.find({
        $or: [
          { name: searchRegex }
        ],
        isPrivate: false
      })
      .populate('user', 'name username avatar')
      .select('name user createdAt media')
      .limit(10);
      
      results.albums = albums;
      console.log('🔍 Found albums:', albums.length);
    } catch (error) {
      console.error('❌ Error searching albums:', error);
    }

    // Search groups
    try {
      const groups = await Group.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ],
        privacy: { $ne: 'secret' }
      })
      .populate('creator', 'name username avatar')
      .select('name description creator privacy memberCount')
      .limit(10);
      
      results.groups = groups;
      console.log('🔍 Found groups:', groups.length);
    } catch (error) {
      console.error('❌ Error searching groups:', error);
    }

    // Search events
    try {
      const events = await Event.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ],
        privacy: { $ne: 'secret' }
      })
      .populate('organizer', 'name username avatar')
      .select('title description organizer startDate endDate location')
      .limit(10);
      
      results.events = events;
      console.log('🔍 Found events:', events.length);
    } catch (error) {
      console.error('❌ Error searching events:', error);
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('🔍 Total search results:', totalResults);
    
    res.json({
      success: true,
      query: q,
      totalResults,
      results
    });

  } catch (error) {
    console.error('❌ Unified search error:', error);
    res.status(500).json({ 
      error: 'Internal server error during search',
      message: error.message 
    });
  }
};

// Quick search (for navbar) - returns top results
exports.quickSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.userId;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const results = [];

    // Quick user search (most relevant)
    try {
      let userQuery = {
        $or: [
          { username: searchRegex }, // Username matches first
          { name: searchRegex },
          { fullName: searchRegex }
        ]
      };

      if (currentUserId) {
        userQuery._id = { $ne: currentUserId };
      }

      const users = await User.find(userQuery)
        .select('name username avatar')
        .limit(5);
      
      users.forEach(user => {
        results.push({
          type: 'user',
          id: user._id,
          title: user.name || user.username,
          subtitle: user.username,
          avatar: user.avatar,
          data: user
        });
      });
    } catch (error) {
      console.error('❌ Error in quick user search:', error);
    }

    // Quick post search
    try {
      const posts = await Post.find({
        content: searchRegex,
        isPrivate: false
      })
      .populate('user', 'name username avatar')
      .select('content user createdAt')
      .limit(3);
      
      posts.forEach(post => {
        results.push({
          type: 'post',
          id: post._id,
          title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
          subtitle: `by ${post.user.name || post.user.username}`,
          avatar: post.user.avatar,
          data: post
        });
      });
    } catch (error) {
      console.error('❌ Error in quick post search:', error);
    }

    // Quick group search
    try {
      const groups = await Group.find({
        name: searchRegex,
        privacy: { $ne: 'secret' }
      })
      .populate('creator', 'name username avatar')
      .select('name description creator')
      .limit(3);
      
      groups.forEach(group => {
        results.push({
          type: 'group',
          id: group._id,
          title: group.name,
          subtitle: group.description ? group.description.substring(0, 50) + '...' : 'Group',
          avatar: group.creator.avatar,
          data: group
        });
      });
    } catch (error) {
      console.error('❌ Error in quick group search:', error);
    }

    // Sort results by relevance (users first, then content)
    const sortedResults = results.sort((a, b) => {
      if (a.type === 'user' && b.type !== 'user') return -1;
      if (b.type === 'user' && a.type !== 'user') return 1;
      return 0;
    });

    console.log('🔍 Quick search results:', sortedResults.length);
    
    res.json({
      success: true,
      query: q,
      results: sortedResults.slice(0, 10) // Limit to 10 results
    });

  } catch (error) {
    console.error('❌ Quick search error:', error);
    res.status(500).json({ 
      error: 'Internal server error during quick search',
      message: error.message 
    });
  }
};
