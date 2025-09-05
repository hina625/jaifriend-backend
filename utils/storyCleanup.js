const Story = require('../models/story');

// Function to clean up expired stories
const cleanupExpiredStories = async () => {
  try {
    const expiredStories = await Story.find({
      isActive: true,
      expiresAt: { $lte: new Date() }
    });

    if (expiredStories.length === 0) {
      return 0;
    }

    // Mark stories as inactive instead of deleting them
    const updatePromises = expiredStories.map(story => 
      Story.findByIdAndUpdate(story._id, { isActive: false })
    );

    await Promise.all(updatePromises);

    return expiredStories.length;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error during story cleanup:', error);
    }
    return 0;
  }
};

// Function to get cleanup statistics
const getCleanupStats = async () => {
  try {
    const totalStories = await Story.countDocuments();
    const activeStories = await Story.countDocuments({ isActive: true });
    const expiredStories = await Story.countDocuments({ 
      isActive: false,
      expiresAt: { $lte: new Date() }
    });
    const upcomingExpirations = await Story.countDocuments({
      isActive: true,
      expiresAt: { 
        $gt: new Date(),
        $lte: new Date(Date.now() + 60 * 60 * 1000) // Next hour
      }
    });

    return {
      total: totalStories,
      active: activeStories,
      expired: expiredStories,
      expiringSoon: upcomingExpirations
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting cleanup stats:', error);
    }
    return null;
  }
};

// Schedule cleanup every hour
let cleanupInterval;

const startCleanupScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Run cleanup every hour
  cleanupInterval = setInterval(async () => {
    await cleanupExpiredStories();
  }, 60 * 60 * 1000); // 1 hour

  if (process.env.NODE_ENV === 'development') {
    console.log('Story cleanup scheduler started (runs every hour)');
  }
};

const stopCleanupScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    if (process.env.NODE_ENV === 'development') {
      console.log('Story cleanup scheduler stopped');
    }
  }
};

// Manual cleanup function (can be called via API)
const manualCleanup = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Manual story cleanup initiated');
  }
  return await cleanupExpiredStories();
};

module.exports = {
  cleanupExpiredStories,
  getCleanupStats,
  startCleanupScheduler,
  stopCleanupScheduler,
  manualCleanup
};
