const SocialLinks = require('../models/socialLinks');
const User = require('../models/user');

// Get user's social links
exports.getSocialLinks = async (req, res) => {
  try {
    console.log('🔍 Getting social links for user:', req.userId);
    
    const socialLinks = await SocialLinks.findOne({ user: req.userId });
    
    if (!socialLinks) {
      // Create default social links if none exist
      const defaultLinks = {
        facebook: '',
        twitter: '',
        vkontakte: '',
        linkedin: '',
        instagram: '',
        youtube: ''
      };
      
      console.log('📝 Creating default social links for user:', req.userId);
      const newSocialLinks = new SocialLinks({
        user: req.userId,
        ...defaultLinks
      });
      
      await newSocialLinks.save();
      console.log('✅ Default social links created successfully');
      
      return res.json(defaultLinks);
    }
    
    console.log('✅ Social links retrieved successfully');
    res.json(socialLinks);
  } catch (error) {
    console.error('❌ Error getting social links:', error);
    res.status(500).json({ error: 'Failed to get social links' });
  }
};

// Update user's social links
exports.updateSocialLinks = async (req, res) => {
  try {
    console.log('🔍 Updating social links for user:', req.userId);
    console.log('📋 Request body:', req.body);
    
    const { facebook, twitter, vkontakte, linkedin, instagram, youtube } = req.body;
    
    // Validate input
    const socialLinksData = {
      facebook: facebook || '',
      twitter: twitter || '',
      vkontakte: vkontakte || '',
      linkedin: linkedin || '',
      instagram: instagram || '',
      youtube: youtube || ''
    };
    
    // Find existing social links or create new ones
    let socialLinks = await SocialLinks.findOne({ user: req.userId });
    
    if (socialLinks) {
      // Update existing
      console.log('📝 Updating existing social links');
      socialLinks.set(socialLinksData);
      await socialLinks.save();
    } else {
      // Create new
      console.log('📝 Creating new social links');
      socialLinks = new SocialLinks({
        user: req.userId,
        ...socialLinksData
      });
      await socialLinks.save();
    }
    
    console.log('✅ Social links updated successfully');
    res.json(socialLinks);
  } catch (error) {
    console.error('❌ Error updating social links:', error);
    res.status(500).json({ error: 'Failed to update social links' });
  }
};

// Delete user's social links
exports.deleteSocialLinks = async (req, res) => {
  try {
    console.log('🔍 Deleting social links for user:', req.userId);
    
    const result = await SocialLinks.findOneAndDelete({ user: req.userId });
    
    if (!result) {
      console.log('⚠️ No social links found to delete');
      return res.status(404).json({ error: 'Social links not found' });
    }
    
    console.log('✅ Social links deleted successfully');
    res.json({ message: 'Social links deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting social links:', error);
    res.status(500).json({ error: 'Failed to delete social links' });
  }
}; 