const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  buyerName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  postal: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema); 