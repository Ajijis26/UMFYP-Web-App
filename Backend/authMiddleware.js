const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'SecretKeyU2001015HAHAHA';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token

  if (!token) {
    console.error("No token provided.")
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    console.log("Token verified successfully:", user);
    req.user = user; // Attach user info to request
    next();
  });
};

module.exports = authenticateToken;
