const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "../../uploads/images");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const hash = crypto.randomBytes(24).toString("hex");
    cb(null, `${hash}${extension}`);
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

module.exports = {
  uploadProductImage,
};
