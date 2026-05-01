// ============================================================================
// 📁 FILE: requestLogger.js (Custom Request Logger Middleware)
// 📍 LOCATION: backend/src/middlewares/requestLogger.js
// 📚 TOPIC: Custom Middleware, Request Timing, Logging
// ============================================================================
//
// 🎯 PURPOSE: Logs every incoming request with a timestamp, HTTP method, and URL.
// Also stores the start time on the request object for potential response-time calculations.
// This runs alongside Morgan (which provides more detailed output).
//
// 🔮 FUTURE: Add response time calculation, log to files, add request IDs for tracing
// ============================================================================

const requestLogger = (req, res, next) => {
  // Store the current timestamp on the request object
  // This could be used later to calculate how long the request took
  // Date.now() returns milliseconds since Unix epoch (Jan 1, 1970)
  req.startTime = Date.now()

  // Log the request with ISO timestamp, HTTP method, and URL
  // Example output: [2024-01-15T10:30:00.000Z] GET /api/v1/posts
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  // Pass control to the next middleware
  // Without next(), the request chain would stop here (request hangs)
  next()
}

export default requestLogger