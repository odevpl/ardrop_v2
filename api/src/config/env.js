const required = [
  "PORT",
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
];

function getEnv() {
  const missing = required.filter((key) => process.env[key] === undefined);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000),
    db: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  };
}

module.exports = {
  getEnv,
};
