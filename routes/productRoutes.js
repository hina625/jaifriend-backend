const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createProduct, getProducts, getLatestProducts, deleteProduct } = require('../controllers/productController');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

// Create product (requires authentication)
router.post('/', auth, upload.single('image'), createProduct);

// Get all products (public)
router.get('/', getProducts);

// Get latest products (public)
router.get('/latest', getLatestProducts);

// Delete product (requires authentication)
router.delete('/:productId', auth, deleteProduct);

module.exports = router; 