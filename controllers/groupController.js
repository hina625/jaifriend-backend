const Group = require('../models/group');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

// Create group
exports.createGroup = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let avatar = null;
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    }

    const groupData = {
      name: req.body.name,
      description: req.body.description,
      creator: req.userId,
      avatar: avatar,
      category: req.body.category || 'general',
      privacy: req.body.privacy || 'public',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      location: req.body.location ? JSON.parse(req.body.location) : null,
      website: req.body.website,
      email: req.body.email,
      phone: req.body.phone
    };

    const group = new Group(groupData);

    // Add creator as admin
    group.admins.push(req.userId);
    group.members.push({
      user: req.userId,
      role: 'admin',
      joinedAt: new Date(),
      isActive: true
    });

    await group.save();
    await group.populate('creator', 'name username avatar');
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get groups
exports.getGroups = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const groups = await Group.find({
      $or: [
        { privacy: 'public' },
        { 'members.user': req.userId },
        { creator: req.userId }
      ],
      isActive: true
    })
    .populate('creator', 'name username avatar')
    .populate('members.user', 'name username avatar')
    .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get public groups
exports.getPublicGroups = async (req, res) => {
  try {
    console.log('🔍 Get public groups request:', { userId: req.userId, user: req.user });
    
    const groups = await Group.getPublicGroups();
    
    console.log('🔍 Found public groups:', groups.length);
    console.log('✅ Public groups fetched successfully');
    
    res.json(groups);
  } catch (error) {
    console.error('❌ Error getting public groups:', error);
    res.status(500).json({ error: error.message });
  }
};

// Search groups
exports.searchGroups = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const groups = await Group.searchGroups(q, req.userId);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'name username avatar')
      .populate('admins', 'name username avatar')
      .populate('moderators', 'name username avatar')
      .populate('members.user', 'name username avatar');

    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check if user can view the group
    if (group.privacy === 'secret' && !group.isMember(req.userId) && group.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get groups by user ID
exports.getGroupsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

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

    const groups = await Group.find({
      $or: [
        { creator: userId },
        { 'members.user': userId }
      ],
      isActive: true
    })
    .populate('creator', 'name username avatar')
    .populate('members.user', 'name username avatar')
    .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Error getting groups by user ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (req.file) {
      // Delete old avatar
      if (group.avatar && group.avatar.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', group.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      group.avatar = `/uploads/${req.file.filename}`;
    }

    Object.assign(group, req.body);
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group images (avatar and cover photo)
exports.updateGroupImages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { avatar, coverPhoto } = req.body;
    const userId = req.userId;

    console.log('🔄 updateGroupImages called:', {
      groupId,
      avatar,
      coverPhoto,
      userId
    });

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('❌ Group not found:', groupId);
      return res.status(404).json({ error: 'Group not found' });
    }

    console.log('✅ Group found:', {
      groupId: group._id,
      name: group.name,
      currentAvatar: group.avatar,
      currentCoverPhoto: group.coverPhoto
    });

    // Check if user is admin of the group
    const isAdmin = group.members.some(member => 
      member.user.toString() === userId && 
      (member.role === 'admin' || group.creator.toString() === userId)
    );

    console.log('🔐 Admin check:', {
      userId,
      isAdmin,
      memberRoles: group.members.map(m => ({ userId: m.user.toString(), role: m.role })),
      creator: group.creator.toString()
    });

    if (!isAdmin) {
      console.log('❌ User not admin:', userId);
      return res.status(403).json({ error: 'Only admins can update group images' });
    }

    // Update avatar if provided
    if (avatar !== undefined) {
      console.log('🔄 Updating avatar:', { from: group.avatar, to: avatar });
      group.avatar = avatar;
    }

    // Update cover photo if provided
    if (coverPhoto !== undefined) {
      console.log('🔄 Updating cover photo:', { from: group.coverPhoto, to: coverPhoto });
      group.coverPhoto = coverPhoto;
    }

    await group.save();
    console.log('✅ Group saved successfully');

    // Populate necessary fields before sending response
    await group.populate('creator', 'name username avatar');
    await group.populate('members.user', 'name username avatar');

    console.log('✅ Group populated successfully');

    res.json({
      success: true,
      message: 'Group images updated successfully',
      group
    });
  } catch (error) {
    console.error('❌ Error updating group images:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Join group
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.isMember(req.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    if (group.privacy === 'private' && !group.settings.autoApproveMembers) {
      // Add as pending member
      group.members.push({
        user: req.userId,
        role: 'member',
        joinedAt: new Date(),
        isActive: false
      });
    } else {
      // Add as active member
      await group.addMember(req.userId, 'member');
    }

    await group.save();
    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isMember(req.userId)) {
      return res.status(400).json({ error: 'Not a member' });
    }

    if (group.creator.toString() === req.userId) {
      return res.status(400).json({ error: 'Creator cannot leave group' });
    }

    await group.removeMember(req.userId);
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Invite user to group
exports.inviteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (group.isMember(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add as pending member
    group.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date(),
      isActive: false
    });

    await group.save();
    res.json({ message: 'User invited to group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve member
exports.approveMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const member = group.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.isActive = true;
    await group.save();

    res.json({ message: 'Member approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject member
exports.rejectMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();

    res.json({ message: 'Member rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (group.creator.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove creator' });
    }

    await group.removeMember(req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Promote member
exports.promoteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await group.updateMemberRole(req.params.userId, 'moderator');
    res.json({ message: 'Member promoted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Demote member
exports.demoteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await group.updateMemberRole(req.params.userId, 'member');
    res.json({ message: 'Member demoted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add admin
exports.addAdmin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    group.admins.push(req.params.userId);
    await group.updateMemberRole(req.params.userId, 'admin');
    res.json({ message: 'Admin added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove admin
exports.removeAdmin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    group.admins = group.admins.filter(id => id.toString() !== req.params.userId);
    await group.updateMemberRole(req.params.userId, 'member');
    res.json({ message: 'Admin removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group posts
exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user.toString() === req.userId && member.isActive
    );
    
    if (group.privacy === 'private' && !isMember) {
      return res.status(403).json({ error: 'Access denied. You must be a member to view posts.' });
    }
    
    // Get posts for this group
    const Post = require('../models/post');
    const posts = await Post.find({ groupId })
      .sort({ createdAt: -1 })
      .populate('user.userId', 'name avatar username')
      .populate('comments.user.userId', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('savedBy', 'name avatar')
      .populate('views', 'name avatar')
      .limit(50);
    
    // Ensure all media URLs are full URLs
    const postsWithFullUrls = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.media && postObj.media.length > 0) {
        postObj.media = postObj.media.map(media => {
          if (media.url && !media.url.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = `${baseUrl}${media.url.startsWith('/') ? media.url : `/${media.url}`}`;
            media.url = fullUrl;
          }
          if (media.thumbnail && !media.thumbnail.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://jaifriend-backend-production.up.railway.app'
              : 'http://localhost:5000';
            const fullUrl = `${baseUrl}${media.thumbnail.startsWith('/') ? media.thumbnail : `/${media.thumbnail}`}`;
            media.thumbnail = fullUrl;
          }
          return media;
        });
      }
      return postObj;
    });
    
    res.json(postsWithFullUrls);
  } catch (error) {
    console.error('Error getting group posts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create group post
exports.createGroupPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;
    
    console.log('📝 createGroupPost called:', {
      groupId,
      userId,
      body: req.body,
      files: req.files
    });
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('❌ Group not found:', groupId);
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user.toString() === userId && member.isActive
    );
    
    console.log('🔐 Member check:', {
      userId,
      isMember,
      memberRoles: group.members.map(m => ({ userId: m.user.toString(), role: m.role, isActive: m.isActive }))
    });
    
    if (!isMember) {
      console.log('❌ User not member:', userId);
      return res.status(403).json({ error: 'You must be a member to post in this group' });
    }
    
    // Create the post using the main post controller
    const Post = require('../models/post');
    const User = require('../models/user');
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user avatar
    let userAvatar = null;
    try {
      const UserImage = require('../models/userImage');
      const userImage = await UserImage.findOne({ userId });
      userAvatar = userImage?.avatar || user.avatar;
      if (!userAvatar) {
        userAvatar = '/avatars/1.png.png';
      }
    } catch (error) {
      userAvatar = user.avatar || '/avatars/1.png.png';
    }
    
    // Process uploaded files
    let media = [];
    if (req.files && req.files.length > 0) {
      console.log('📁 Processing uploaded files:', req.files.length);
      media = req.files.map(file => ({
        url: file.path, // Cloudinary URL or local path
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));
    }
    
    // Parse hashtags if they exist
    let hashtags = [];
    if (req.body.hashtags) {
      try {
        hashtags = JSON.parse(req.body.hashtags);
      } catch (error) {
        console.log('⚠️ Error parsing hashtags:', error);
        hashtags = [];
      }
    }
    
    const postData = {
      content: req.body.content || '',
      title: req.body.title || '',
      privacy: req.body.privacy || 'public',
      hashtags: hashtags,
      user: { 
        userId, 
        name: user.name || user.username || 'Unknown User', 
        avatar: userAvatar 
      },
      userId,
      postType: req.body.postType || 'text',
      groupId,
      media: media
    };
    
    console.log('📝 Creating post with data:', postData);
    
    const post = new Post(postData);
    await post.save();
    
    console.log('✅ Post saved successfully:', post._id);
    
    // Populate user info
    await post.populate('user.userId', 'name avatar username');
    
    res.status(201).json(post);
  } catch (error) {
    console.error('❌ Error creating group post:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get group events
exports.getGroupEvents = async (req, res) => {
  try {
    // Placeholder - implement when event model supports groups
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create group event
exports.createGroupEvent = async (req, res) => {
  try {
    // Placeholder - implement when event model supports groups
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group settings
exports.getGroupSettings = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(group.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group settings
exports.updateGroupSettings = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    group.settings = { ...group.settings, ...req.body };
    await group.save();

    res.json(group.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add group rule
exports.addGroupRule = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const rule = {
      title: req.body.title,
      description: req.body.description,
      order: group.rules.length + 1
    };

    group.rules.push(rule);
    await group.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group rule
exports.updateGroupRule = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const rule = group.rules.id(req.params.ruleId);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    Object.assign(rule, req.body);
    await group.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete group rule
exports.deleteGroupRule = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    group.rules = group.rules.filter(r => r._id.toString() !== req.params.ruleId);
    await group.save();

    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group stats
exports.getGroupStats = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.isAdmin(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(group.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group members
exports.getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'name username avatar isOnline lastSeen');

    if (!group) return res.status(404).json({ error: 'Group not found' });

    res.json(group.members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 