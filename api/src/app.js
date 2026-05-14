const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const authMiddleware = require("./middlewares/auth.middleware");
const rateLimit = require("./middlewares/rate-limit.middleware");
const authController = require("./controllers/auth");
const contactController = require("./controllers/contact");
const sellerController = require("./controllers/sellers");
const usersController = require("./controllers/users");
const clientsController = require("./controllers/clients");
const productsController = require("./controllers/products");
const categoriesController = require("./controllers/categories");
const cartsController = require("./controllers/carts");
const accountController = require("./controllers/account");
const clientDeliveryAddressesController = require("./controllers/client-delivery-addresses");
const clientSpecialPricesRouter = require("./routes/clientSpecialPrices");
const configController = require("./controllers/config");
const deliveriesController = require("./controllers/deliveries");
const ordersController = require("./controllers/orders");
const marketingController = require("./controllers/marketing");
const sellerSettingsController = require("./controllers/seller-settings");
const sellerFinancialHistoryController = require("./controllers/seller-financial-history");

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
  ? envOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
  const isPublicRegister = req.method === "POST" && req.path === "/auth/register";
  const isPublicCompanyLookup =
    req.method === "GET" && req.path === "/auth/company-lookup";
  const isPublicActivate = req.method === "POST" && req.path === "/auth/activate";
  const isPublicForgotPassword =
    req.method === "POST" && req.path === "/auth/forgot-password";
  const isPublicResetPassword =
    req.method === "POST" && req.path === "/auth/reset-password";
  const isPublicMe = req.method === "GET" && req.path === "/auth/me";
  const isPublicContact =
    req.method === "POST" && /^\/contact\/[^/]+$/.test(req.path);

  if (
    isPublicHealth ||
    isPublicLogin ||
    isPublicRegister ||
    isPublicCompanyLookup ||
    isPublicActivate ||
    isPublicForgotPassword ||
    isPublicResetPassword ||
    isPublicMe ||
    isPublicContact
  ) {
    return next();
  }

  return authMiddleware(req, res, next);
});

app.use(
  "/auth/login",
  rateLimit({ keyPrefix: "auth:login:app", limit: 10, windowMs: 15 * 60 * 1000 }),
);
app.use(
  "/auth/register",
  rateLimit({ keyPrefix: "auth:register:app", limit: 5, windowMs: 60 * 60 * 1000 }),
);
app.use(
  "/auth/forgot-password",
  rateLimit({ keyPrefix: "auth:forgot:app", limit: 5, windowMs: 60 * 60 * 1000 }),
);
app.use("/auth", authController);
app.use("/", contactController);
app.use("/", sellerController);
app.use("/", usersController);
app.use("/", clientsController);
app.use("/", productsController);
app.use("/", categoriesController);
app.use("/", configController);
app.use("/", cartsController);
app.use("/", accountController);
app.use("/", clientDeliveryAddressesController);
app.use("/", clientSpecialPricesRouter);
app.use("/", deliveriesController);
app.use("/", ordersController);
app.use("/", marketingController);
app.use("/", sellerSettingsController);
app.use("/", sellerFinancialHistoryController);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
