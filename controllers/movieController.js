const Movie = require('../models/movie');
const User = require('../models/user');

// Get all movies with filtering and pagination
exports.getAllMovies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genres,
      countries,
      search,
      sort = 'createdAt',
      order = 'desc',
      quality,
      year,
      language
    } = req.query;

    // Build filter object
    const filter = {};

    if (genres) {
      const genreArray = genres.split(',');
      filter.genres = { $in: genreArray };
    }

    if (countries) {
      const countryArray = countries.split(',');
      filter.country = { $in: countryArray };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (quality) {
      filter.quality = quality;
    }

    if (year) {
      filter.releaseYear = parseInt(year);
    }

    if (language) {
      filter.language = language;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const movies = await Movie.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('likes', 'name avatar')
      .populate('dislikes', 'name avatar')
      .populate('comments.user.userId', 'name avatar');

    const total = await Movie.countDocuments(filter);

    res.json({
      movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMovies: total,
        hasNext: skip + movies.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies', error: error.message });
  }
};

// Get movie by ID
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('likes', 'name avatar')
      .populate('dislikes', 'name avatar')
      .populate('comments.user.userId', 'name avatar');

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Increment views
    movie.views += 1;
    await movie.save();

    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Error fetching movie', error: error.message });
  }
};

// Create new movie
exports.createMovie = async (req, res) => {
  try {
    const movieData = req.body;

    // Handle file uploads if any
    if (req.files) {
      if (req.files.poster) {
        movieData.poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.video) {
        movieData.videoUrl = `/uploads/${req.files.video[0].filename}`;
      }
    }

    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ message: 'Error creating movie', error: error.message });
  }
};

// Update movie
exports.updateMovie = async (req, res) => {
  try {
    const movieData = req.body;

    // Handle file uploads if any
    if (req.files) {
      if (req.files.poster) {
        movieData.poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.video) {
        movieData.videoUrl = `/uploads/${req.files.video[0].filename}`;
      }
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      movieData,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ message: 'Error updating movie', error: error.message });
  }
};

// Delete movie
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ message: 'Error deleting movie', error: error.message });
  }
};

// Toggle like/dislike
exports.toggleReaction = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const likeIndex = movie.likes.indexOf(userId);
    const dislikeIndex = movie.dislikes.indexOf(userId);

    if (type === 'like') {
      if (likeIndex > -1) {
        // Remove like
        movie.likes.splice(likeIndex, 1);
      } else {
        // Add like and remove dislike if exists
        movie.likes.push(userId);
        if (dislikeIndex > -1) {
          movie.dislikes.splice(dislikeIndex, 1);
        }
      }
    } else if (type === 'dislike') {
      if (dislikeIndex > -1) {
        // Remove dislike
        movie.dislikes.splice(dislikeIndex, 1);
      } else {
        // Add dislike and remove like if exists
        movie.dislikes.push(userId);
        if (likeIndex > -1) {
          movie.likes.splice(likeIndex, 1);
        }
      }
    }

    await movie.save();
    res.json(movie);
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ message: 'Error toggling reaction', error: error.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const comment = {
      user: {
        userId: userId,
        name: user.name,
        avatar: user.avatar
      },
      text: text
    };

    movie.comments.push(comment);
    await movie.save();

    // Populate the new comment
    await movie.populate('comments.user.userId', 'name avatar');

    res.json(movie);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const comment = movie.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment owner or movie owner
    if (String(comment.user.userId) !== String(userId) && String(movie.user.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    movie.comments.pull(commentId);
    await movie.save();

    res.json({ message: 'Comment deleted successfully', movie });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Get recommended movies
exports.getRecommendedMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isRecommended: true })
      .sort({ rating: -1, views: -1 })
      .limit(20)
      .populate('likes', 'name avatar');

    res.json(movies);
  } catch (error) {
    console.error('Error fetching recommended movies:', error);
    res.status(500).json({ message: 'Error fetching recommended movies', error: error.message });
  }
};

// Get new movies
exports.getNewMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isNew: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('likes', 'name avatar');

    res.json(movies);
  } catch (error) {
    console.error('Error fetching new movies:', error);
    res.status(500).json({ message: 'Error fetching new movies', error: error.message });
  }
};

// Get most watched movies
exports.getMostWatchedMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isPopular: true })
      .sort({ views: -1, rating: -1 })
      .limit(20)
      .populate('likes', 'name avatar');

    res.json(movies);
  } catch (error) {
    console.error('Error fetching most watched movies:', error);
    res.status(500).json({ message: 'Error fetching most watched movies', error: error.message });
  }
};

// Search movies
exports.searchMovies = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const movies = await Movie.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .populate('likes', 'name avatar');

    res.json(movies);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ message: 'Error searching movies', error: error.message });
  }
};

// Get movie statistics
exports.getMovieStats = async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalViews = await Movie.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const avgRating = await Movie.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const genreStats = await Movie.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const countryStats = await Movie.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalMovies,
      totalViews: totalViews[0]?.totalViews || 0,
      avgRating: avgRating[0]?.avgRating || 0,
      topGenres: genreStats,
      topCountries: countryStats
    });
  } catch (error) {
    console.error('Error fetching movie stats:', error);
    res.status(500).json({ message: 'Error fetching movie stats', error: error.message });
  }
};

// Get available filters
exports.getAvailableFilters = async (req, res) => {
  try {
    const genres = await Movie.distinct('genres');
    const countries = await Movie.distinct('country');
    const languages = await Movie.distinct('language');
    const qualities = await Movie.distinct('quality');
    const years = await Movie.distinct('releaseYear');

    res.json({
      genres: genres.sort(),
      countries: countries.sort(),
      languages: languages.sort(),
      qualities: qualities.sort(),
      years: years.sort((a, b) => b - a) // Sort years descending
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Error fetching filters', error: error.message });
  }
}; 