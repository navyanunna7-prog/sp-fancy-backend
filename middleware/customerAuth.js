
const jwt = require("jsonwebtoken");

module.exports = function customerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please login to access your wishlist",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid customer token. Please login again.",
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Session expired or invalid. Please login again.",
    });
  }
};
