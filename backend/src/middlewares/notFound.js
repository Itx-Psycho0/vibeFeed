// ============================================================================
// 📁 FILE: notFound.js (404 Not Found Middleware)
// 📍 LOCATION: backend/src/middlewares/notFound.js
// 📚 TOPIC: Handling Unknown Routes, 404 Errors
// ============================================================================
//
// 🎯 PURPOSE: Catches requests to URLs that don't match ANY defined route.
// Placed AFTER all routes in app.js — if a request reaches here, no route handled it.
// Creates a 404 error and passes it to the global error handler.
// ============================================================================

const notFound = (req, res, next) => {
  // Create a new Error with the unmatched URL in the message
  // req.originalUrl contains the full requested URL path
  const err = new Error(`Route '${req.originalUrl}' not found`)

  // Set a custom statusCode property on the error object
  // The error handler will use this to set the HTTP response status
  err.statusCode = 404

  // Pass the error to the next middleware (the error handler)
  // When next() receives an argument, Express treats it as an error
  // and skips all remaining non-error middleware, going straight to error handlers
  next(err)
}

export default notFound