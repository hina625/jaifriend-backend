const Product = require('../models/product');

exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, currency, price, type, location, category, totalItemUnits
    } = req.body;
    const image = req.file ? req.file.filename : null;
    if (!name || !price || !currency) {
      return res.status(400).json({ error: 'Name, price, and currency are required.' });
    }
    const product = new Product({
      name, description, currency, price, type, location, category, totalItemUnits, image
    });
    await product.save();
    const imageUrl = image ? `${req.protocol}://${req.get('host')}/uploads/${image}` : null;
    res.status(201).json({ ...product.toObject(), imageUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const productsWithImageUrl = products.map(product => ({
      ...product.toObject(),
      imageUrl: product.image ? `${req.protocol}://${req.get('host')}/uploads/${product.image}` : null
    }));
    res.json(productsWithImageUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 