const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set both for compatibility
    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    
    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired', 
        error: 'Token has expired. Please login again.' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token', 
        error: 'Token is invalid or corrupted. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      message: 'Token verification failed', 
      error: 'Unable to verify token. Please login again.' 
    });
  }
};

module.exports = authMiddleware;
