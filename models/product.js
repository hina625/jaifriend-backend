const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  currency: String,
  price: Number,
  type: String,
  location: String,
  category: String,
  totalItemUnits: Number,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema); 