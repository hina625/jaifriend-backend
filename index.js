const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

// Passport config
require('./config/passport');

// Initialize express app
const app = express();

// Set fallback JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fallback-secret-key-for-development';
  console.log('⚠️  Using fallback JWT_SECRET. Set JWT_SECRET in .env for production.');
}

// Middleware to parse JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Add frontend URL to request object
app.use((req, res, next) => {
  req.frontendUrl = FRONTEND_URL;
  next();
});

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/albums', require('./routes/albumRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/upgrade', require('./routes/upgradeRoutes'));
app.use('/api/filemonitor', require('./routes/fileMonitorRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/userimages', require('./routes/userImageRoutes'));
app.use('/api/dataexports', require('./routes/dataExportRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings/password', require('./routes/passwordRoutes'));
app.use('/api/settings/privacy', require('./routes/privacyRoutes'));
app.use('/api/settings/profile', require('./routes/profileSettingsRoutes'));

// Static file access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.send('🚀 API is running');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: process.env.MONGO_URI ? 'Configured' : 'Not configured'
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);

  // Connect to database
  if (process.env.MONGO_URI) {
    console.log('🔄 Connecting to MongoDB...');
    connectDB().catch(err => {
      console.log('⚠️  Database connection failed.');
      console.log('💡 Make sure MONGO_URI is correct in Railway environment variables.');
    });
  } else {
    console.log('⚠️  No MONGO_URI provided. Skipping DB connection.');
  }

  // Start file monitor if needed
  const fileMonitor = require('./utils/fileMonitor');
  setTimeout(() => {
    fileMonitor.startWatching();
  }, 2000);
});
