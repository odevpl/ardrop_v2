const express = require("express");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.use("/", require("./controllers/auth.js"));
app.use("/", require("./controllers/seller.js"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
