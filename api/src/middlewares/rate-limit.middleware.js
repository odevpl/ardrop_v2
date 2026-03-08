const buckets = new Map();

const cleanupExpired = (now) => {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const rateLimit = ({ keyPrefix, limit, windowMs }) => {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpired(now);

    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const bucketKey = `${keyPrefix}:${ip}`;
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "Too many attempts. Try again later.",
      });
    }

    current.count += 1;
    buckets.set(bucketKey, current);
    return next();
  };
};

module.exports = rateLimit;
