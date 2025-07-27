const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const albumRoutes = require('./routes/albumRoutes');
const videoRoutes = require('./routes/videoRoutes');
const eventRoutes = require('./routes/eventRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const pageRoutes = require('./routes/pageRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const fileMonitorRoutes = require('./routes/fileMonitorRoutes');
const movieRoutes = require('./routes/movieRoutes');
const session = require('express-session');
const passport = require('passport');
require('./config/passport'); // Passport strategies config (to be created)

dotenv.config();

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

const app = express();

// IMPORTANT: Middleware for parsing JSON
app.use(express.json());

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // allow your frontend origin
  credentials: true // if you want to allow cookies/auth headers
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes); // Use same routes for user endpoints
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/filemonitor', fileMonitorRoutes);
app.use('/api/movies', movieRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start file monitoring after server starts
  const fileMonitor = require('./utils/fileMonitor');
  setTimeout(() => {
    fileMonitor.startWatching();
  }, 2000); // Start after 2 seconds to ensure everything is loaded
});