const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Bearer token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Token extracted:', token ? 'Yes' : 'No');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded successfully:', decoded);
    console.log('🔐 User ID from token:', decoded.userId);
    
    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    
    console.log('🔐 req.user set to:', req.user);
    console.log('🔐 req.userId set to:', req.userId);
    
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

module.exports = authMiddleware;
