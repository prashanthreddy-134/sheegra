import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
    }

    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sheegra",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

// Admin-only image upload
router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image file provided",
        });
      }

      const result = await uploadToCloudinary(req.file.buffer);

      return res.status(201).json({
        url: result.secure_url,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err.message?.includes("images are allowed")
  ) {
    return res.status(400).json({
      error: err.message,
    });
  }

  console.error("Image upload error:", err);
  return res.status(500).json({
    error: "Image upload failed",
  });
});

export default router;