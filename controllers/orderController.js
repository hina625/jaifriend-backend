const Order = require('../models/order');

exports.createOrder = async (req, res) => {
  try {
    const { productId, productName, productImage, productPrice, buyerName, address, phone, city, postal } = req.body;
    if (!productId || !productName || !productImage || !productPrice || !buyerName || !address || !phone || !city || !postal) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const order = new Order({ productId, productName, productImage, productPrice, buyerName, address, phone, city, postal });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 