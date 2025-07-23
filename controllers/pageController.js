const Page = require('../models/page');

// Create a new page
exports.createPage = async (req, res) => {
  try {
    const { name, url, description, category } = req.body;
    // Optionally, get user from req.user if using auth
    // const createdBy = req.user ? req.user._id : null;
    const page = new Page({
      name,
      url,
      description,
      category,
      // createdBy
    });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 