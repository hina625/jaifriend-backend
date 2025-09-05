const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.registerUser = async (req, res) => {
  const { name, email, password, username, gender } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }
  
  // Check if database is connected
  if (mongoose.connection.readyState !== 1) {
    console.log('Database connection state:', mongoose.connection.readyState);
    console.log('Attempting to reconnect...');
    
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Reconnected to database successfully');
    } catch (reconnectError) {
      console.error('Reconnection failed:', reconnectError.message);
      return res.status(503).json({ 
        message: 'Database not connected. Please check your MongoDB connection.',
        error: 'Database connection required'
      });
    }
  }
  
  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Ensure name is provided to satisfy validation
    const userName = name || username; // Use username as fallback if name is not provided
    
    user = new User({ 
      name: userName, 
      email, 
      password: hashedPassword, 
      username,
      gender: gender || 'Prefer not to say'
    });
    await user.save();

    // Generate JWT token after registration
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      isSetupDone: user.isSetupDone
    });
  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    // Provide more specific error messages
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: err.message,
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username',
        error: 'Duplicate key error'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.login = async (req, res) => {
  const { username, email, password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  // Check if either username or email is provided
  if (!username && !email) {
    return res.status(400).json({ message: 'Username or email is required' });
  }
  
  try {
    // Try to find user by username or email
    let user;
    if (username) {
      user = await User.findOne({ username });
    } else if (email) {
      user = await User.findOne({ email });
    }
    
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      isSetupDone: user.isSetupDone,
      message: 'Login successful',
      user: {
        _id: user._id,
        email: user.email,
        avatar: user.avatar,
        name: user.name,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setupProfile = async (req, res) => {
  const { avatar, fullName, bio, location } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = avatar;
    user.fullName = fullName;
    user.bio = bio;
    user.location = location;
    user.isSetupDone = true;
    await user.save();

    res.json({ message: 'Profile setup completed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      avatar: user.avatar,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      location: user.location
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
