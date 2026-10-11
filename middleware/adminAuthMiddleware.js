const jwt = require("jsonwebtoken");

function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    console.log("ADMIN AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        message: "Admin authentication required",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        message: "Admin token missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("ADMIN JWT DECODED:", decoded);

    if (!decoded.adminId) {
      return res.status(403).json({
        message: "Invalid admin token",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired admin token",
    });
  }
}

module.exports = adminAuthMiddleware;