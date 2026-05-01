// ============================================================================
// 📁 FILE: upload.routes.js — File Upload Route
// 📚 TOPIC: Middleware Chaining (auth → multer upload → controller)
// ============================================================================
// This route chains THREE middleware/handlers in sequence:
//   1. auth — verify JWT token
//   2. upload.single('file') — Multer parses the file and uploads to Cloudinary
//   3. uploadFile — sends the Cloudinary URL back to the client
// ============================================================================

import { uploadFile } from '../controllers/upload.controller.js';
import auth from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import express from 'express';

const router = express.Router();

// upload.single('file') expects a single file with field name 'file'
// The frontend must use FormData with: formData.append('file', selectedFile)
router.post('/', auth, upload.single('file'), uploadFile);

export default router;
