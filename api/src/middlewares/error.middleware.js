function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
