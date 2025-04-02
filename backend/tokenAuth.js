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
function authenticateToken(req, res, next) {
  try {
    // Get the authorization header
    const authHeader = req.headers["authorization"];

    // Check if authorization header exists and has the right format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. Authorization header missing or invalid format.",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(403)
            .json({ error: "Token expired. Please log in again." });
        }
        return res.status(403).json({ error: "Invalid token." });
      }

      // Attach user info to request
      req.user = decoded;

      // Continue to the next middleware or route
      next();
    });
  } catch (error) {
    console.error("Token authentication error:", error);
    return res
      .status(500)
      .json({ error: "Authentication failed due to server error." });
  }
}

module.exports = authenticateToken;
