const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middlewares/authMiddleware');
const { createProduct, getProducts, getLatestProducts } = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create product (requires authentication)
router.post('/', auth, upload.single('image'), createProduct);

// Get all products (public)
router.get('/', getProducts);

// Get latest products (public)
router.get('/latest', getLatestProducts);

module.exports = router; 