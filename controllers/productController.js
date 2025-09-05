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
      
      // Check if Cloudinary is configured
      const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET &&
                                    process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' &&
                                    process.env.CLOUDINARY_API_KEY !== 'your-api-key' &&
                                    process.env.CLOUDINARY_API_SECRET !== 'your-api-secret';
      
      console.log('🔍 Cloudinary Configuration Check:');
      console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
      console.log('  - API Key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
      console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
      console.log('  - Is Configured:', isCloudinaryConfigured);
      
      if (isCloudinaryConfigured) {
        // Use Cloudinary URL (already a full HTTPS URL)
        imageUrl = req.file.path;
        console.log('☁️ Cloudinary image URL:', imageUrl);
      } else {
        // For local storage, construct a relative URL
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('📁 Local image URL:', imageUrl);
        console.log('⚠️ WARNING: Using local storage - images will be lost on server restart!');
        console.log('💡 Suggestion: Set up Cloudinary for permanent image storage');
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
    
    // Debug: Log image information for each product
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        name: product.name,
        image: product.image,
        hasImage: !!product.image,
        imageType: typeof product.image,
        imageLength: product.image ? product.image.length : 0
      });
    });
    
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

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if user is authenticated
    if (!req.userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('🔍 Looking for product with ID:', productId);
    const product = await Product.findById(productId);
    
    if (!product) {
      console.log('❌ Product not found with ID:', productId);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user owns the product
    if (product.seller.toString() !== req.userId) {
      console.log('❌ User not authorized to delete this product');
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }
    
    console.log('✅ Product found and user authorized, deleting...');
    
    // Delete the product
    await Product.findByIdAndDelete(productId);
    
    console.log('✅ Product deleted successfully');
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    console.error('Error stack:', err.stack);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message 
    });
  }
}; 