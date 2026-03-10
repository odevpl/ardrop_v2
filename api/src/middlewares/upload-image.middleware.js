const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "../../uploads/images");
fs.mkdirSync(uploadDir, { recursive: true });
const marketingUploadDir = path.resolve(__dirname, "../../uploads/marketing");
fs.mkdirSync(marketingUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(24).toString("hex");
    cb(null, `${hash}.jpg`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  const error = new Error("Only image files are allowed");
  error.status = 400;
  cb(error);
};

const uploadProductImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

const marketingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, marketingUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(24).toString("hex");
    cb(null, `${hash}.jpg`);
  },
});

const uploadMarketingImage = multer({
  storage: marketingStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = {
  uploadProductImage,
  uploadMarketingImage,
};
