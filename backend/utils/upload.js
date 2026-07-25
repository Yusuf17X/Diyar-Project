import multer from "multer";
import AppError from "./appError.js";

// Store files in memory so we can upload them directly to Supabase
const storage = multer.memoryStorage();

// Filter for only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

export default upload;
