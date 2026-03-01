const jwt = require("jsonwebtoken");
const { getEnv } = require("../config/env");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.slice(7);

  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;
