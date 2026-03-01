const express = require("express");
const cors = require("cors");
const authMiddleware = require("./middlewares/auth.middleware");
const roleMiddleware = require("./middlewares/role.middleware");
const authController = require("./controllers/auth");
const sellerController = require("./controllers/sellers");
const usersController = require("./controllers/users");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error.middleware");

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authController);
app.use("/", authMiddleware, roleMiddleware("ADMIN"), sellerController);
app.use("/", authMiddleware, roleMiddleware("ADMIN"), usersController);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
