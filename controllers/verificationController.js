const Verification = require('../models/verification');
const User = require('../models/user');
const { isCloudinaryConfigured } = require('../config/cloudinary');

// Submit verification request
exports.submitVerification = async (req, res) => {
  try {
    console.log('🔍 Submitting verification request for user:', req.userId);
    console.log('📋 Request body:', req.body);
    console.log('📁 Files:', req.files);
    
    const { username, message } = req.body;
    
    // Validate required fields
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    if (!req.files || !req.files.passportDocument || !req.files.personalPicture) {
      return res.status(400).json({ error: 'Both passport document and personal picture are required' });
    }
    
    // Check if user already has a pending verification
    const existingVerification = await Verification.findOne({ 
      user: req.userId, 
      status: 'pending' 
    });
    
    if (existingVerification) {
      return res.status(400).json({ error: 'You already have a pending verification request' });
    }
    
    // Handle file uploads
    let passportDocumentUrl = null;
    let personalPictureUrl = null;
    
    if (req.files.passportDocument) {
      console.log('📸 Processing passport document:', req.files.passportDocument.name);
      if (isCloudinaryConfigured) {
        passportDocumentUrl = req.files.passportDocument.path;
      } else {
        passportDocumentUrl = `/uploads/${req.files.passportDocument.filename}`;
      }
    }
    
    if (req.files.personalPicture) {
      console.log('📸 Processing personal picture:', req.files.personalPicture.name);
      if (isCloudinaryConfigured) {
        personalPictureUrl = req.files.personalPicture.path;
      } else {
        personalPictureUrl = `/uploads/${req.files.personalPicture.filename}`;
      }
    }
    
    // Create verification request
    const verification = new Verification({
      user: req.userId,
      username: username.trim(),
      message: message ? message.trim() : '',
      passportDocument: passportDocumentUrl,
      personalPicture: personalPictureUrl,
      status: 'pending'
    });
    
    await verification.save();
    
    console.log('✅ Verification request submitted successfully');
    res.status(201).json({
      message: 'Verification request submitted successfully',
      verification
    });
  } catch (error) {
    console.error('❌ Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
};

// Get user's verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    console.log('🔍 Getting verification status for user:', req.userId);
    
    const verification = await Verification.findOne({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name username');
    
    if (!verification) {
      return res.json({ status: 'none', verification: null });
    }
    
    console.log('✅ Verification status retrieved successfully');
    res.json({
      status: verification.status,
      verification
    });
  } catch (error) {
    console.error('❌ Error getting verification status:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};

// Get all verification requests (admin only)
exports.getAllVerifications = async (req, res) => {
  try {
    console.log('🔍 Getting all verification requests');
    
    const verifications = await Verification.find()
      .populate('user', 'name username email')
      .populate('reviewedBy', 'name username')
      .sort({ createdAt: -1 });
    
    console.log('✅ All verification requests retrieved successfully');
    res.json(verifications);
  } catch (error) {
    console.error('❌ Error getting all verifications:', error);
    res.status(500).json({ error: 'Failed to get verification requests' });
  }
};

// Review verification request (admin only)
exports.reviewVerification = async (req, res) => {
  try {
    console.log('🔍 Reviewing verification request:', req.params.verificationId);
    console.log('📋 Request body:', req.body);
    
    const { status, adminNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
    }
    
    const verification = await Verification.findById(req.params.verificationId);
    
    if (!verification) {
      return res.status(404).json({ error: 'Verification request not found' });
    }
    
    // Update verification
    verification.status = status;
    verification.adminNotes = adminNotes || '';
    verification.reviewedBy = req.userId;
    verification.reviewedAt = new Date();
    
    await verification.save();
    
    // If approved, update user's verification status
    if (status === 'approved') {
      await User.findByIdAndUpdate(verification.user, { 
        isVerified: true,
        verifiedAt: new Date()
      });
    }
    
    console.log('✅ Verification request reviewed successfully');
    res.json({
      message: 'Verification request reviewed successfully',
      verification
    });
  } catch (error) {
    console.error('❌ Error reviewing verification:', error);
    res.status(500).json({ error: 'Failed to review verification request' });
  }
};

// Delete verification request
exports.deleteVerification = async (req, res) => {
  try {
    console.log('🔍 Deleting verification request:', req.params.verificationId);
    
    const verification = await Verification.findById(req.params.verificationId);
    
    if (!verification) {
      return res.status(404).json({ error: 'Verification request not found' });
    }
    
    // Check if user owns this verification or is admin
    if (verification.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this verification request' });
    }
    
    await Verification.findByIdAndDelete(req.params.verificationId);
    
    console.log('✅ Verification request deleted successfully');
    res.json({ message: 'Verification request deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting verification:', error);
    res.status(500).json({ error: 'Failed to delete verification request' });
  }
}; 