const Invitation = require('../models/invitation');
const User = require('../models/user');

// Get user's invitation statistics
const getInvitationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for different statuses
    const [availableCount, generatedCount, usedCount] = await Promise.all([
      Invitation.countDocuments({ 
        userId, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      }),
      Invitation.countDocuments({ userId }),
      Invitation.countDocuments({ 
        userId, 
        status: 'used' 
      })
    ]);

    res.json({
      success: true,
      data: {
        availableLinks: availableCount,
        generatedLinks: generatedCount,
        usedLinks: usedCount
      }
    });

  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation statistics'
    });
  }
};

// Generate new invitation link
const generateInvitation = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has available invitations (limit to 10 per user)
    const totalInvitations = await Invitation.countDocuments({ userId });
    if (totalInvitations >= 10) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum limit of 10 invitations'
      });
    }

    // Create new invitation
    const invitation = new Invitation({
      userId
    });

    await invitation.save();

    // Get updated stats
    const [availableCount, generatedCount, usedCount] = await Promise.all([
      Invitation.countDocuments({ 
        userId, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      }),
      Invitation.countDocuments({ userId }),
      Invitation.countDocuments({ 
        userId, 
        status: 'used' 
      })
    ]);

    // Generate full invitation URL with frontend URL
    const frontendUrl = req.frontendUrl || 'https://jaifriend-frontend-n6zr.vercel.app' || 'http://localhost:3000';
    const invitationUrl = `${frontendUrl}/register?invitationCode=${invitation.invitationCode}`;

    res.status(201).json({
      success: true,
      message: 'Invitation link generated successfully',
      data: {
        invitationId: invitation._id,
        invitationCode: invitation.invitationCode,
        invitationUrl: invitationUrl,
        stats: {
          availableLinks: availableCount,
          generatedLinks: generatedCount,
          usedLinks: usedCount
        }
      }
    });

  } catch (error) {
    console.error('Error generating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invitation link'
    });
  }
};

// Get user's invitation history
const getUserInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const invitations = await Invitation.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('usedBy', 'name username avatar')
      .select('-__v');

    const total = await Invitation.countDocuments({ userId });

    // Add full invitation URLs to each invitation
    const frontendUrl = req.frontendUrl || 'https://jaifriend-frontend-n6zr.vercel.app' || 'http://localhost:3000';
    const invitationsWithUrls = invitations.map(invitation => ({
      ...invitation.toObject(),
      invitationUrl: `${frontendUrl}/register?invitationCode=${invitation.invitationCode}`
    }));

    res.json({
      success: true,
      data: {
        invitations: invitationsWithUrls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations'
    });
  }
};

// Get specific invitation by ID
const getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const invitation = await Invitation.findOne({
      _id: invitationId,
      userId
    }).populate('usedBy', 'name username avatar');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Add full invitation URL
    const frontendUrl = req.frontendUrl || 'http://localhost:3000';
    const invitationWithUrl = {
      ...invitation.toObject(),
      invitationUrl: `${frontendUrl}/register?invitationCode=${invitation.invitationCode}`
    };

    res.json({
      success: true,
      data: invitationWithUrl
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation'
    });
  }
};

// Use invitation code (for registration)
const useInvitationCode = async (req, res) => {
  try {
    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required'
      });
    }

    // Find invitation by code
    const invitation = await Invitation.findOne({
      invitationCode: invitationCode.toUpperCase(),
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation code'
      });
    }

    // Update invitation status
    invitation.status = 'used';
    invitation.usedAt = new Date();
    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation code used successfully',
      data: {
        invitationId: invitation._id,
        generatedBy: invitation.userId
      }
    });

  } catch (error) {
    console.error('Error using invitation code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use invitation code'
    });
  }
};

// Delete invitation
const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const invitation = await Invitation.findOne({
      _id: invitationId,
      userId,
      status: 'active'
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already used'
      });
    }

    await Invitation.findByIdAndDelete(invitationId);

    // Get updated stats
    const [availableCount, generatedCount, usedCount] = await Promise.all([
      Invitation.countDocuments({ 
        userId, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      }),
      Invitation.countDocuments({ userId }),
      Invitation.countDocuments({ 
        userId, 
        status: 'used' 
      })
    ]);

    res.json({
      success: true,
      message: 'Invitation deleted successfully',
      data: {
        stats: {
          availableLinks: availableCount,
          generatedLinks: generatedCount,
          usedLinks: usedCount
        }
      }
    });

  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invitation'
    });
  }
};

// Clean up expired invitations (cron job function)
const cleanupExpiredInvitations = async () => {
  try {
    const result = await Invitation.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() }
      },
      {
        status: 'expired'
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} expired invitations`);
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
  }
};

module.exports = {
  getInvitationStats,
  generateInvitation,
  getUserInvitations,
  getInvitationById,
  useInvitationCode,
  deleteInvitation,
  cleanupExpiredInvitations
}; 