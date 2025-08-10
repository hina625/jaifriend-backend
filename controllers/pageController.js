const Page = require('../models/page');
const User = require('../models/user');

// Create a new page
exports.createPage = async (req, res) => {
  try {
    console.log('Creating page with data:', req.body);
    
    const { name, url, description, category } = req.body;
    
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    if (!name || !url || !description || !category) {
      return res.status(400).json({ error: 'Name, URL, description, and category are required' });
    }
    
    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if URL is already taken
    const existingPage = await Page.findOne({ url });
    if (existingPage) {
      return res.status(400).json({ error: 'Page URL already exists' });
    }
    
    const page = new Page({
      name,
      url,
      description,
      category,
      createdBy: req.userId,
      creatorName: user.name || user.username || 'Unknown User',
      creatorAvatar: user.avatar || '/avatars/1.png.png'
    });
    
    await page.save();
    await page.populate('createdBy', 'name username avatar');
    
    console.log('Page created successfully:', page._id);
    res.status(201).json(page);
  } catch (err) {
    console.error('Error creating page:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all pages
exports.getPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 });
    
    // If user is authenticated, add like information
    if (req.userId) {
      const pagesWithLikes = pages.map(page => {
        const pageObj = page.toObject();
        pageObj.isLiked = page.likes && page.likes.includes(req.userId);
        pageObj.likes = page.likes ? page.likes.length : 0;
        return pageObj;
      });
      res.json(pagesWithLikes);
    } else {
      // For non-authenticated users, just return pages with like counts
      const pagesWithCounts = pages.map(page => {
        const pageObj = page.toObject();
        pageObj.likes = page.likes ? page.likes.length : 0;
        pageObj.isLiked = false;
        return pageObj;
      });
      res.json(pagesWithCounts);
    }
    
    console.log('Pages fetched:', pages.length);
  } catch (err) {
    console.error('Error fetching pages:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get pages by user
exports.getUserPages = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const pages = await Page.find({ createdBy: req.userId })
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 });
    
    console.log('User pages fetched:', pages.length);
    res.json(pages);
  } catch (err) {
    console.error('Error fetching user pages:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get page by ID
exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('createdBy', 'name username avatar');
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (err) {
    console.error('Error fetching page:', err);
    res.status(500).json({ error: err.message });
  }
};

// Like/Unlike page
exports.likePage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Check if user already liked the page
    const isLiked = page.likes && page.likes.includes(userId);
    
    if (isLiked) {
      // Unlike: remove user from likes array
      page.likes = page.likes.filter(likeId => likeId.toString() !== userId);
    } else {
      // Like: add user to likes array
      if (!page.likes) page.likes = [];
      page.likes.push(userId);
    }

    await page.save();
    
    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: page.likes.length,
      message: isLiked ? 'Page unliked' : 'Page liked'
    });
  } catch (err) {
    console.error('Error liking/unliking page:', err);
    res.status(500).json({ error: err.message });
  }
}; 