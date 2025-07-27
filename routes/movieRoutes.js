const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for movie uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow video files for movie uploads
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for movie uploads'), false);
      }
    } else if (file.fieldname === 'poster') {
      // Allow image files for posters
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for posters'), false);
      }
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos
  }
});

// Public routes (no authentication required)
router.get('/', movieController.getAllMovies);
router.get('/recommended', movieController.getRecommendedMovies);
router.get('/new', movieController.getNewMovies);
router.get('/popular', movieController.getMostWatchedMovies);
router.get('/search', movieController.searchMovies);
router.get('/stats', movieController.getMovieStats);
router.get('/filters', movieController.getAvailableFilters);
router.get('/:id', movieController.getMovieById);

// Protected routes (authentication required)
router.post('/', auth, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), movieController.createMovie);

router.put('/:id', auth, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), movieController.updateMovie);

router.delete('/:id', auth, movieController.deleteMovie);

// Movie reactions (likes/dislikes)
router.post('/:movieId/reaction', auth, movieController.toggleReaction);

// Movie comments
router.post('/:movieId/comment', auth, movieController.addComment);
router.delete('/:movieId/comment/:commentId', auth, movieController.deleteComment);

module.exports = router; 