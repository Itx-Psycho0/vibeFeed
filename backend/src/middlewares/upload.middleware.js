// ============================================================================
// 📁 FILE: upload.middleware.js (File Upload Middleware)
// 📍 LOCATION: backend/src/middlewares/upload.middleware.js
// 📚 TOPIC: File Uploads with Multer + Cloudinary Storage
// ============================================================================
//
// 🎯 PURPOSE:
// Configures Multer to upload files directly to Cloudinary (cloud storage).
// Multer handles multipart/form-data (the format used for file uploads in HTML forms).
//
// 🧠 HOW FILE UPLOAD WORKS:
// 1. Frontend sends a file via <input type="file"> in a form
// 2. The browser sends it as multipart/form-data (not JSON)
// 3. Multer parses the file from the request
// 4. multer-storage-cloudinary sends the file to Cloudinary's servers
// 5. Cloudinary returns a URL and public_id
// 6. The controller receives the file info on req.file
//
// 🔀 ALTERNATIVES: AWS S3 + multer-s3, local disk storage (multer.diskStorage),
//                  Firebase Storage, direct frontend-to-Cloudinary upload (bypass server)
//
// 🔮 FUTURE: Add file size limits, file type validation, image compression,
//            generate thumbnails, virus scanning
// ============================================================================

import multer from 'multer';              // File upload handling library
import { CloudinaryStorage } from 'multer-storage-cloudinary';  // Bridge between Multer and Cloudinary
import cloudinary from '../config/cloudinary.js';  // Our configured Cloudinary instance

// ─── Configure Cloudinary Storage ───────────────────────────────────────────
// CloudinaryStorage tells Multer WHERE to store files (on Cloudinary, not locally)
// Without this, Multer would save files to the server's filesystem (which doesn't scale)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,         // The configured Cloudinary instance from config
  params: {
    folder: 'vibefeed',           // All uploads go to 'vibefeed' folder in Cloudinary
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp', 'mp4'],  // Accepted file types
    resource_type: 'auto',        // 'auto' detects if it's an image or video
    // 🔮 FUTURE: Add transformations here (e.g., auto-resize, auto-quality)
    // transformation: [{ width: 1080, crop: 'limit' }]
  },
});

// ─── Create and Export Multer Instance ───────────────────────────────────────
// multer({ storage }) creates a middleware that processes file uploads
// Usage in routes: upload.single('file') — handles ONE file with field name 'file'
// Other options: upload.array('files', 10) — multiple files, upload.none() — no files
export const upload = multer({ storage: storage });
