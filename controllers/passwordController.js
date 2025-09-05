const bcrypt = require('bcryptjs');
const User = require('../models/user');
const PasswordChange = require('../models/passwordChange');

// Change user password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, twoFactorAuthentication } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await PasswordChange.create({
        userId,
        status: 'failed',
        reason: 'Incorrect current password',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Validate password strength
    const minLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!minLength || !hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    user.password = hashedNewPassword;
    
    // Update two-factor authentication if provided
    if (typeof twoFactorAuthentication === 'boolean') {
      user.twoFactorEnabled = twoFactorAuthentication;
    }

    await user.save();

    // Log successful password change
    await PasswordChange.create({
      userId,
      status: 'success',
      twoFactorEnabled: user.twoFactorEnabled,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        twoFactorEnabled: user.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};

// Get password change history
const getPasswordHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const passwordChanges = await PasswordChange.find({ userId })
      .sort({ changedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await PasswordChange.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        passwordChanges,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching password history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch password history'
    });
  }
};

// Get password security stats
const getPasswordStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalChanges, successfulChanges, failedChanges, lastChange] = await Promise.all([
      PasswordChange.countDocuments({ userId }),
      PasswordChange.countDocuments({ userId, status: 'success' }),
      PasswordChange.countDocuments({ userId, status: 'failed' }),
      PasswordChange.findOne({ userId }).sort({ changedAt: -1 })
    ]);

    // Get user's two-factor status
    const user = await User.findById(userId).select('twoFactorEnabled');
    const twoFactorEnabled = user?.twoFactorEnabled || false;

    res.json({
      success: true,
      data: {
        totalChanges,
        successfulChanges,
        failedChanges,
        lastChange,
        twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Error fetching password stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch password statistics'
    });
  }
};

// Validate password strength
const validatePasswordStrength = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      score: 0
    };

    // Calculate strength score
    if (minLength) strength.score += 1;
    if (hasUppercase) strength.score += 1;
    if (hasLowercase) strength.score += 1;
    if (hasNumber) strength.score += 1;
    if (hasSpecialChar) strength.score += 1;

    let strengthLevel = 'weak';
    if (strength.score >= 4) strengthLevel = 'strong';
    else if (strength.score >= 3) strengthLevel = 'medium';

    res.json({
      success: true,
      data: {
        strength,
        strengthLevel,
        isValid: strength.score >= 3
      }
    });

  } catch (error) {
    console.error('Error validating password strength:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate password strength'
    });
  }
};

module.exports = {
  changePassword,
  getPasswordHistory,
  getPasswordStats,
  validatePasswordStrength
}; 