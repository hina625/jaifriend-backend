const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createEvent, getEvents, deleteEvent, updateEvent } = require('../controllers/eventController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), createEvent);
router.get('/', getEvents);
router.delete('/:id', deleteEvent);
router.put('/:id', upload.single('image'), updateEvent);

module.exports = router; 