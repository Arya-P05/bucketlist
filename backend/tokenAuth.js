const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT tokens
 * This middleware extracts the JWT token from the Authorization header,
 * verifies it, and attaches the decoded user data to the request object.
 *
 * Usage:
 * - Add this middleware to routes that require authentication:
 *   app.get('/protected-route', authenticateToken, (req, res) => {...});
 *
 * - Access the authenticated user in your route handlers:
 *   const userId = req.user.userId;
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Try to verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If token is expired, we'll handle it in the refresh endpoint
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
};

const generateToken = (userId) => {
  // Generate a token that expires in 7 days for longer sessions
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = {
  authenticateToken,
  generateToken,
};
