const dotenv = require("dotenv");
dotenv.config();

// Fallback error handler for invalid routes
exports.notFoundHandler = (req, res, next) => {
  const notFoundError = new Error(`Not Found : '${req.originalUrl}'`);
  res.status(404);
  next(notFoundError);
};

exports.appErrorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  const status = `${statusCode}`.startsWith("4")
    ? "Client error"
    : "Server error";

  res.status(statusCode).json({
    status,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
