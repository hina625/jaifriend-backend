const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const albumRoutes = require('./routes/albumRoutes');
const videoRoutes = require('./routes/videoRoutes');
const reelRoutes = require('./routes/reelRoutes');
const eventRoutes = require('./routes/eventRoutes');
const groupRoutes = require('./routes/groupRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const pageRoutes = require('./routes/pageRoutes');
const jobRoutes = require('./routes/jobRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const userImageRoutes = require('./routes/userImageRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const fileMonitorRoutes = require('./routes/fileMonitorRoutes');
const movieRoutes = require('./routes/movieRoutes');
const storyRoutes = require('./routes/storyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const privacyRoutes = require('./routes/privacyRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const socialLinksRoutes = require('./routes/socialLinksRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const websiteSettingsRoutes = require('./routes/websiteSettingsRoutes');
const fileRoutes = require('./routes/fileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const locationRoutes = require('./routes/locationRoutes');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
// Temporarily comment out passport to fix route loading
const passport = require('passport');
 require('./config/passport'); // Passport strategies config (to be created)

// Set fallback JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jaifriend-secure-jwt-secret-key-2024-production';
  if (process.env.NODE_ENV === 'development') {
    console.log('Using fallback JWT_SECRET. Set JWT_SECRET in .env for production.');
  }
}

// Connect to database (optional for now)
if (process.env.MONGO_URI) {
  connectDB();
} else if (process.env.NODE_ENV === 'development') {
  console.log('No MONGO_URI provided. Database features will not work.');
}

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const coverPhotosDir = path.join(uploadsDir, 'cover-photos');
const postMediaDir = path.join(uploadsDir, 'post-media');

[uploadsDir, profilePhotosDir, coverPhotosDir, postMediaDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

//Force HTTPS in production - Commented out for Railway deployment
//Railway handles HTTPS automatically, so we don't need this redirect
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// CORS configuration - must come before other middleware
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://jaifriend.hgdjlive.com',
    'https://jaifriend.hgdjlive.com'
  ],
  credentials: true,
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
// app.options('*', cors());

// Trust proxy for proper IP detection (important for IP-based geolocation)
app.set('trust proxy', true);

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });
}



// IMPORTANT: Middleware for parsing JSON
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
}));
// Temporarily comment out passport middleware
 app.use(passport.initialize());
app.use(passport.session());

// Mount auth routes FIRST, before other routes
try {
  app.use('/api/auth', authRoutes);
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error loading auth routes:', error);
  }
}

// Mount all other routes AFTER auth routes
app.use('/api/users', userRoutes);
app.use('/api/userimages', userImageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/videos', videoRoutes);
try {
  app.use('/api/reels', reelRoutes);
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error loading reels routes:', error);
  }
}
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/filemonitor', fileMonitorRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/website-settings', websiteSettingsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/location', locationRoutes);
// REMOVED: Static file serving for uploads since we're using Cloudinary
// app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// Test routes removed - no longer needed





// Global error handler for multer and other errors
app.use((error, req, res, next) => {
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large',
      error: 'File size exceeds the 100MB limit'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      message: 'Too many files',
      error: 'Maximum 10 files allowed per upload'
    });
  }
  
  if (error.message && error.message.includes('File type not supported')) {
    return res.status(400).json({
      message: 'Unsupported file type',
      error: error.message
    });
  }
  
  // Handle other errors
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error:', error);
  }
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add 404 handler
app.use('*', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('404 - Route not found:', req.method, req.originalUrl);
  }
  res.status(404).json({ 
    message: 'Route not found', 
    method: req.method, 
    url: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
 
  const fileMonitor = require('./utils/fileMonitor');
  const storyCleanup = require('./utils/storyCleanup');
  
  setTimeout(() => {
    fileMonitor.startWatching();
    storyCleanup.startCleanupScheduler();
  }, 2000); // Start after 2 seconds to ensure everything is loaded
});