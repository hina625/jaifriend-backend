const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createProduct, getProducts } = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), createProduct);
router.get('/', getProducts);

module.exports = router; 