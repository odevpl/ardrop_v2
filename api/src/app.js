const express = require("express");
const cors = require("cors");
const path = require("path");
const authMiddleware = require("./middlewares/auth.middleware");
const authController = require("./controllers/auth");
const sellerController = require("./controllers/sellers");
const usersController = require("./controllers/users");
const productsController = require("./controllers/products");
const cartsController = require("./controllers/carts");
const accountController = require("./controllers/account");
const clientDeliveryAddressesController = require("./controllers/client-delivery-addresses");
const deliveriesController = require("./controllers/deliveries");
const ordersController = require("./controllers/orders");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error.middleware");

const app = express();

const defaultOrigins = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "https://app.ardrop.pl",
  "https://seller.ardrop.pl",
  "https://admin.ardrop.pl",
];
const envOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
const allowedOrigins = envOrigins
  ? envOrigins.split(",").map((origin) => origin.trim()).filter(Boolean)
  : defaultOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
  const isPublicHealth = req.method === "GET" && req.path === "/health";
  const isPublicLogin = req.method === "POST" && req.path === "/auth/login";
  const isPublicMe = req.method === "GET" && req.path === "/auth/me";

  if (isPublicHealth || isPublicLogin || isPublicMe) {
    return next();
  }

  return authMiddleware(req, res, next);
});

app.use("/auth", authController);
app.use("/", sellerController);
app.use("/", usersController);
app.use("/", productsController);
app.use("/", cartsController);
app.use("/", accountController);
app.use("/", clientDeliveryAddressesController);
app.use("/", deliveriesController);
app.use("/", ordersController);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
