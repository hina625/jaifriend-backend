const Product = require('../models/product');
const User = require('../models/user');
const { isCloudinaryConfigured } = require('../config/cloudinary');

exports.createProduct = async (req, res) => {
  try {
    console.log('=== Product Creation Started ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID from auth:', req.userId);
    
    const {
      name, description, currency, price, type, location, category, totalItemUnits
    } = req.body;
    
    // Check if user is authenticated
    if (!req.userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    if (!name || !name.trim()) {
      console.log('❌ Name is missing or empty');
      return res.status(400).json({ error: 'Product name is required.' });
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      console.log('❌ Invalid price:', price);
      return res.status(400).json({ error: 'Valid price is required.' });
    }
    
    if (!currency || !currency.trim()) {
      console.log('❌ Currency is missing');
      return res.status(400).json({ error: 'Currency is required.' });
    }
    
    // Check if user exists
    console.log('🔍 Looking up user with ID:', req.userId);
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('❌ User not found with ID:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ User found:', user.name || user.username);
    
    // Handle image URL
    let imageUrl = null;
    if (req.file) {
      console.log('📸 Image uploaded successfully:', req.file.path);
      if (isCloudinaryConfigured) {
      imageUrl = req.file.path; // Cloudinary secure URL
      } else {
        // For local storage, construct a relative URL
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('📁 Local image URL:', imageUrl);
      }
    } else {
      console.log('📸 No image uploaded');
    }
    
    // Prepare product data
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      currency: currency.trim(),
      price: parseFloat(price),
      type: type || 'New',
      location: location ? location.trim() : '',
      category: category || 'Other',
      totalItemUnits: parseInt(totalItemUnits) || 1,
      image: imageUrl,
      seller: req.userId,
      sellerName: user.name || user.username || 'Unknown Seller'
    };
    
    console.log('📦 Product data prepared:', productData);
    
    const product = new Product(productData);
    
    console.log('💾 Saving product to database...');
    await product.save();
    console.log('✅ Product saved with ID:', product._id);
    
    console.log('👥 Populating seller information...');
    await product.populate('seller', 'name username avatar');
    
    console.log('✅ Product created successfully:', product._id);
    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Error creating product:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data format' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message 
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name username avatar')
      .sort({ createdAt: -1 });
    
    console.log('Products fetched:', products.length);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getLatestProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('Latest products fetched:', products.length);
    res.json(products);
  } catch (err) {
    console.error('Error fetching latest products:', err);
    res.status(500).json({ error: err.message });
  }
}; 