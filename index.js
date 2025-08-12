const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const albumRoutes = require('./routes/albumRoutes');
const videoRoutes = require('./routes/videoRoutes');
const eventRoutes = require('./routes/eventRoutes');
const groupRoutes = require('./routes/groupRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const pageRoutes = require('./routes/pageRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const userImageRoutes = require('./routes/userImageRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const fileMonitorRoutes = require('./routes/fileMonitorRoutes');
const movieRoutes = require('./routes/movieRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const privacyRoutes = require('./routes/privacyRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const socialLinksRoutes = require('./routes/socialLinksRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const websiteSettingsRoutes = require('./routes/websiteSettingsRoutes');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
// Temporarily comment out passport to fix route loading
const passport = require('passport');
 require('./config/passport'); // Passport strategies config (to be created)

// Set fallback JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fallback-secret-key-for-development';
  console.log('⚠️  Using fallback JWT_SECRET. Set JWT_SECRET in .env for production.');
}

// Connect to database (optional for now)
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('⚠️  No MONGO_URI provided. Database features will not work.');
}

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const coverPhotosDir = path.join(uploadsDir, 'cover-photos');
const postMediaDir = path.join(uploadsDir, 'post-media');

[uploadsDir, profilePhotosDir, coverPhotosDir, postMediaDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

const app = express();

//Force HTTPS in production - Commented out for Railway deployment
//Railway handles HTTPS automatically, so we don't need this redirect
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
      next();
    }
  });
}

// CORS configuration - must come before other middleware
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://jaifriend-frontend-n6zr.vercel.app',
    'https://jaifriend-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Request logging middleware for debugging (keep this for now)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl} - Content-Type: ${req.headers['content-type']}`);
  next();
});



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
  // Add logging middleware specifically for auth routes
  app.use('/api/auth', (req, res, next) => {
    console.log(`🔐 Auth route accessed: ${req.method} ${req.originalUrl}`);
    console.log(`📋 Request headers:`, req.headers);
    console.log(`📦 Request body:`, req.body);
    next();
  }, authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error);
}

// Mount all other routes AFTER auth routes
app.use('/api/users', userRoutes);
app.use('/api/userimages', userImageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/filemonitor', fileMonitorRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/website-settings', websiteSettingsRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// Test routes removed - no longer needed





// Add 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  console.log('🔍 Full request details:', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    headers: req.headers,
    body: req.body
  });
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
  setTimeout(() => {
    fileMonitor.startWatching();
  }, 2000); // Start after 2 seconds to ensure everything is loaded
});