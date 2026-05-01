// ============================================================================
// 📁 FILE: cloudinary.js (Cloud Storage Configuration)
// 📍 LOCATION: backend/src/config/cloudinary.js
// 📚 TOPIC: Cloudinary Cloud Media Storage Setup
// 🏗️ BUILD ORDER: Step 3c — Build alongside other config files
// ============================================================================
//
// 🎯 PURPOSE:
// This file configures Cloudinary, a cloud service for storing images and videos.
// When users upload profile pictures, post images, or story media, the files
// are sent to Cloudinary's servers (not stored on our server's hard drive).
//
// 🧠 WHY NOT STORE FILES ON OUR SERVER?
// - Server storage is limited and expensive to scale
// - If the server crashes, files are lost (unless you have backups)
// - Cloudinary provides a CDN (Content Delivery Network) — files load fast worldwide
// - Cloudinary can automatically resize, crop, and optimize images
// - Cloudinary provides image transformation URLs (e.g., add watermarks, blur faces)
//
// 🧠 HOW CLOUDINARY WORKS:
//   1. User uploads an image from the frontend
//   2. Our server receives the file (via Multer middleware)
//   3. Multer-storage-cloudinary sends the file to Cloudinary's servers
//   4. Cloudinary stores it and returns a URL (e.g., https://res.cloudinary.com/...)
//   5. We save that URL in MongoDB (not the actual file)
//   6. Frontend displays the image using the Cloudinary URL
//
// 🔀 ALTERNATIVE FILE STORAGE SERVICES:
// - AWS S3 (Amazon Simple Storage Service — most popular, enterprise-grade)
// - Firebase Storage (Google, easy to use with Firebase ecosystem)
// - Azure Blob Storage (Microsoft cloud storage)
// - DigitalOcean Spaces (S3-compatible, cheaper)
// - Supabase Storage (open-source, built on S3)
// - MinIO (self-hosted S3-compatible, free and open-source)
// - Imgbb or Imgur API (free image hosting, limited features)
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add image optimization (auto-format to WebP for smaller file sizes)
// - Add image transformation presets (thumbnail, medium, large sizes)
// - Add video transcoding (convert to different formats/qualities)
// - Add automatic moderation (detect inappropriate content using Cloudinary AI)
// - Add watermarking for downloaded images
// - Add backup strategy for uploaded media
// ============================================================================

// ─── Import Cloudinary SDK ──────────────────────────────────────────────────
// 'v2' is the latest version of the Cloudinary SDK
// We rename it to 'cloudinary' for cleaner usage: cloudinary.config(...)
// The 'as' keyword renames the import (called "import aliasing")
// TOPIC: Cloud SDK — A library that lets your code talk to a cloud service
// WHY v2: Cloudinary has v1 (legacy) and v2 (current). Always use v2.
import { v2 as cloudinary } from 'cloudinary';

// Import dotenv to load environment variables
// We need this here because this config file might be imported independently
// dotenv.config() is idempotent — calling it multiple times is safe (no side effects)
// TOPIC: Environment Variables — Secure way to store API keys and secrets
import dotenv from 'dotenv';

// Load .env variables into process.env
// After this line, process.env.CLOUDINARY_CLOUD_NAME is available
dotenv.config();

// ─── Configure Cloudinary ───────────────────────────────────────────────────
// cloudinary.config() sets up the authentication credentials
// These credentials are found in your Cloudinary Dashboard (cloudinary.com)
//
// Three required credentials:
//   cloud_name: Your unique Cloudinary account identifier (like a username)
//   api_key:    Public key for API access (like a user ID)
//   api_secret: Private key for authentication (like a password — NEVER expose this!)
//
// These values come from .env file for security:
//   CLOUDINARY_CLOUD_NAME=df9ip2doy
//   CLOUDINARY_API_KEY=734969748571273
//   CLOUDINARY_API_SECRET=O0UYZX4fDgqH_yQ0k5oEBIxA4OY
//
// ⚠️ SECURITY: NEVER hardcode these values in your source code!
//    They should ALWAYS be in .env (which is in .gitignore, so they won't be pushed to GitHub)
//
// TOPIC: API Authentication — How your server proves its identity to Cloudinary
// WHY: Without valid credentials, Cloudinary would reject upload requests
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary account name
  api_key: process.env.CLOUDINARY_API_KEY,         // Public API key
  api_secret: process.env.CLOUDINARY_API_SECRET,   // Secret API key (keep private!)
});

// ─── Export Configured Cloudinary Instance ───────────────────────────────────
// We export the configured cloudinary object so other files can use it
// Specifically, upload.middleware.js uses this for the Multer-Cloudinary storage
// TOPIC: Configured Singleton — One configured instance shared across the app
export default cloudinary;
