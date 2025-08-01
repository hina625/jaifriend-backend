const Product = require('../models/product');
const User = require('../models/user');

exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    console.log('File:', req.file);
    
    const {
      name, description, currency, price, type, location, category, totalItemUnits
    } = req.body;
    
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    if (!name || !price || !currency) {
      return res.status(400).json({ error: 'Name, price, and currency are required.' });
    }
    
    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle image URL
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary secure URL
    }
    
    const product = new Product({
      name,
      description,
      currency,
      price: parseFloat(price),
      type,
      location,
      category,
      totalItemUnits: parseInt(totalItemUnits) || 1,
      image: imageUrl,
      seller: req.userId,
      sellerName: user.name || user.username || 'Unknown Seller'
    });
    
    await product.save();
    await product.populate('seller', 'name username avatar');
    
    console.log('Product created successfully:', product._id);
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
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