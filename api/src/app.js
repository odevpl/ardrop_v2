const express = require("express");
const cors = require("cors");
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

app.use("/", require("./routes"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
