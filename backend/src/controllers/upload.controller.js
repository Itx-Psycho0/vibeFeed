// ============================================================================
// 📁 FILE: upload.controller.js — File Upload Handler
// 📚 TOPIC: File Upload Response, Cloudinary Integration
// ============================================================================
// 🎯 PURPOSE: Handles the response after Multer + Cloudinary upload middleware
// processes the file. By the time this controller runs, the file is already
// uploaded to Cloudinary. We just send back the URL and public_id.
//
// REQUEST FLOW: Route → auth middleware → upload.single('file') middleware → THIS controller
// The upload middleware (Multer) does the heavy lifting; this just formats the response.
//
// 🔮 FUTURE: Multiple file upload, file type validation, image optimization
// ============================================================================

export const uploadFile = async (req, res, next) => {
  try {
    // req.file is populated by Multer middleware
    // If no file was attached to the request, req.file is undefined
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Return the Cloudinary URL and public_id
    // req.file.path = Cloudinary URL (e.g., https://res.cloudinary.com/df9ip2doy/image/upload/...)
    // req.file.filename = Cloudinary public_id (used to delete/transform the file later)
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: req.file.path,           // The full URL to access the file
        public_id: req.file.filename,  // Cloudinary identifier (for future delete/transform)
      },
    });
  } catch (error) {
    next(error);
  }
};
