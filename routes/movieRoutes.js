const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const auth = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

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