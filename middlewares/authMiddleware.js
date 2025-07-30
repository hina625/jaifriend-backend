const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('🔐 Auth middleware called');
  console.log('Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  
  // Check for null or undefined tokens
  if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    console.log('❌ No valid auth header found or token is null/undefined');
    return res.status(401).json({ message: 'No valid token provided' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Invalid auth header format');
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }

  const token = authHeader.split(' ')[1];
  
  // Additional check for null/undefined token values
  if (!token || token === 'null' || token === 'undefined') {
    console.log('❌ Token is null or undefined');
    return res.status(401).json({ message: 'Token is null or undefined' });
  }
  
  console.log('🔑 Token received:', token);
  console.log('🔑 JWT_SECRET used for verification:', process.env.JWT_SECRET);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified, userId:', decoded.userId);
    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

module.exports = authMiddleware;
