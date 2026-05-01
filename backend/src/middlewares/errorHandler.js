// ============================================================================
// 📁 FILE: errorHandler.js (Global Error Handler Middleware)
// 📍 LOCATION: backend/src/middlewares/errorHandler.js
// 📚 TOPIC: Centralized Error Handling, Production vs Development Errors
// ============================================================================
//
// 🎯 PURPOSE: Catches ALL errors from routes/middleware and sends clean JSON responses.
// Express recognizes this as an error handler because it has 4 parameters (err, req, res, next).
//
// 🧠 WHY CENTRALIZED ERROR HANDLING?
// Without this, every route would need its own try/catch with error formatting.
// With this, routes just call next(error) and this handler formats the response.
//
// 🔮 FUTURE: Add error logging (Winston/Sentry), error categorization, error IDs for tracking
// ============================================================================

// Express error-handling middleware has 4 params: (err, req, res, next)
// The 'err' parameter is what makes Express treat this as an error handler
// It MUST have all 4 params even if 'next' isn't used — Express checks param count!
const errorHandler = (err, req, res, next) => {
  // Use the error's status code, or default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500

  // In production, hide internal error details (security)
  // In development, show the actual error message (debugging)
  // WHY: Error messages might expose internal details (file paths, DB queries)
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'  // Generic message for production
    : err.message               // Actual error message for development

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      status: statusCode,
      // Only include stack trace in development (helps debug, but security risk in production)
      // Spread operator (...) conditionally adds the 'stack' property
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}

export default errorHandler