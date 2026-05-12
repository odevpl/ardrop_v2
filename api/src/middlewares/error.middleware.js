function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "Image too large. Max size is 5MB",
    });
  }

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const isDatabaseError =
    err?.sql ||
    err?.sqlMessage ||
    err?.errno ||
    ["ER_", "SQLITE_", "SQL"].some((prefix) => String(err?.code || "").startsWith(prefix));

  if (status >= 500) {
    console.error("[error]", {
      message: err?.message,
      code: err?.code,
      status,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const message =
    status >= 500 || isDatabaseError
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(status).json({
    error: isProduction && status >= 500 ? "Internal Server Error" : message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
