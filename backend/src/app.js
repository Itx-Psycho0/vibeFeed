// ============================================================================
// 📁 FILE: app.js
// 📍 LOCATION: backend/src/app.js
// 📚 TOPIC: Express Application Configuration & Middleware Pipeline
// 🏗️ BUILD ORDER: Step 2 — Build this AFTER server.js
// ============================================================================
//
// 🎯 PURPOSE:
// This file creates and configures the Express application.
// Express is the web FRAMEWORK that handles HTTP requests (GET, POST, PUT, DELETE).
// Think of Express as a restaurant manager — it receives customer orders (requests),
// routes them to the right kitchen station (controller), and sends back the food (response).
//
// 📖 WHAT THIS FILE DOES (in order):
// 1. Creates an Express application instance
// 2. Registers MIDDLEWARE (functions that process every request before it reaches routes)
// 3. Registers ROUTES (URL endpoints the frontend can call)
// 4. Registers ERROR HANDLERS (what happens when something goes wrong)
//
// 🧠 UNDERSTANDING MIDDLEWARE:
// Middleware = Functions that run BETWEEN receiving a request and sending a response
// Think of middleware like security checkpoints at an airport:
//   Request → [JSON Parser] → [URL Parser] → [CORS] → [Logger] → [Route Handler] → Response
// Each middleware can:
//   - Modify the request (add data to req object)
//   - Modify the response (add headers)
//   - End the request-response cycle (send a response)
//   - Call next() to pass control to the next middleware
//
// 🧠 UNDERSTANDING THE MIDDLEWARE ORDER (CRITICAL!):
// Middleware runs in the ORDER you register it with app.use()
// This order matters! For example:
//   - JSON parser MUST come before routes (so req.body is available)
//   - Auth middleware MUST come before protected routes
//   - Error handler MUST be LAST (it catches errors from everything above)
//   - notFound MUST come AFTER all routes (it catches unmatched URLs)
//
// 🔀 ALTERNATIVE FRAMEWORKS:
// - Fastify (faster than Express, built-in schema validation)
// - Koa.js (by the creators of Express, more modern async/await)
// - Hapi.js (configuration-driven, built by Walmart)
// - NestJS (TypeScript-first, Angular-like, uses Express under the hood)
// - Next.js API Routes (if you're already using Next.js for frontend)
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add rate limiting middleware (express-rate-limit) to prevent API abuse
// - Add helmet middleware for security headers
// - Add compression middleware to compress responses (gzip)
// - Add API versioning strategy (v1, v2, etc.)
// - Add Swagger/OpenAPI documentation with swagger-ui-express
// - Add request validation middleware (using Joi or Zod)
// ============================================================================

// ─── IMPORTS: Core Libraries ───────────────────────────────────────────────

// Express is the web framework — it gives us the ability to handle HTTP requests
// 'import' is ES Module syntax (enabled by "type": "module" in package.json)
// ALTERNATIVE: const express = require('express') — This is CommonJS syntax (older style)
// We use ES Modules because they're the modern JavaScript standard
import express from 'express'

// CORS (Cross-Origin Resource Sharing) controls which websites can call our API
// Without CORS, a browser would block requests from http://localhost:5173 (frontend)
// to http://localhost:8000 (backend) because they're on different ports = different "origins"
// TOPIC: CORS — Browser security mechanism preventing unauthorized cross-domain requests
// WHY: Browsers block cross-origin requests by default for security
// ALTERNATIVE: Could set CORS headers manually, but this library makes it easy
import cors from 'cors'

// Morgan is an HTTP request logger — it logs every incoming request to the console
// Example output: "GET /api/v1/posts 200 45.123 ms - 1234"
// Shows: HTTP method, URL, status code, response time, response size
// TOPIC: Request Logging — Tracking every API call for debugging
// WHY: When something breaks, logs help you trace what happened
// ALTERNATIVE: Could use Winston, Pino, or Bunyan for more advanced logging
import morgan from 'morgan'

// ─── IMPORTS: Custom Middleware ────────────────────────────────────────────

// Our custom middleware functions — each handles a specific concern
// These are imported from the middlewares folder (we created these ourselves)
// TOPIC: Custom Middleware — Writing your own request processing functions

// Request logger adds timestamp and logs method + URL (our custom version alongside Morgan)
import requestLogger from './middlewares/requestLogger.js'

// Not Found handler — creates a 404 error for URLs that don't match any route
import notFound from './middlewares/notFound.js'

// Error Handler — catches ALL errors and sends a clean JSON error response
// This is a special Express middleware with 4 parameters: (err, req, res, next)
import errorHandler from './middlewares/errorHandler.js'

// ─── IMPORTS: Route Modules ───────────────────────────────────────────────

// Each route module handles a specific RESOURCE (like users, posts, comments)
// This follows the REST API design pattern where each URL represents a resource
// TOPIC: RESTful API Design — Organizing your API around resources
// 
// REST principles:
//   GET    /api/v1/posts     → Get all posts (Read)
//   POST   /api/v1/posts     → Create a new post (Create)
//   GET    /api/v1/posts/:id → Get one post (Read)
//   PUT    /api/v1/posts/:id → Update a post (Update)
//   DELETE /api/v1/posts/:id → Delete a post (Delete)
//
// These CRUD operations (Create, Read, Update, Delete) are the foundation of most APIs

// Routes imports
// Auth routes handle: register, login, get current user
import authRoutes from './routes/auth.route.js'

// User routes handle: profile, follow/unfollow, search users, bookmarks
import userRoutes from './routes/user.routes.js'

// Post routes handle: create/read/update/delete posts, feed, explore, search
import postRoutes from './routes/post.routes.js'

// Comment routes handle: add/edit/delete comments, nested replies
import commentRoutes from './routes/comment.routes.js'

// Like routes handle: like/unlike posts and comments
import likeRoutes from './routes/like.routes.js'

// Story routes handle: create/view/delete stories (24-hour content)
import storyRoutes from './routes/story.routes.js'

// Notification routes handle: get/read/delete notifications
import notificationRoutes from './routes/notification.routes.js'

// Message routes handle: conversations, send/receive messages
import messageRoutes from './routes/message.routes.js'

// Upload routes handle: file uploads to Cloudinary (images, videos)
import uploadRoutes from './routes/upload.routes.js'

// ─── CREATE EXPRESS APPLICATION ─────────────────────────────────────────────

// express() creates a new Express application instance
// This 'app' object has methods for routing (app.get, app.post, etc.)
// and middleware registration (app.use)
// TOPIC: Express Application Object — The core of your web server
//server
const app = express()


// ─── MIDDLEWARE REGISTRATION ────────────────────────────────────────────────
// app.use() registers middleware that runs for EVERY request
// Order matters! These execute top to bottom for each request

// ─── Middleware 1: JSON Body Parser ────────────────────────────────────────
// express.json() parses incoming request bodies with JSON content
// Without this, req.body would be undefined when the frontend sends JSON data
// Example: When frontend sends { "email": "test@test.com", "password": "123456" }
//          this middleware converts the raw text into a JavaScript object on req.body
// TOPIC: Request Body Parsing — Converting raw HTTP body into usable data
// WHY: HTTP sends data as raw text/bytes — we need to parse it into objects
// ALTERNATIVE: Could use body-parser library (older approach, now built into Express)
//json middleware
app.use(express.json())


// ─── Middleware 2: URL-Encoded Form Data Parser ────────────────────────────
// Parses data from HTML forms (content-type: application/x-www-form-urlencoded)
// Extended: true allows nested objects in form data (using the 'qs' library)
// Extended: false uses the simpler 'querystring' library (only flat data)
// Example: From a form submission: "username=john&email=john@test.com"
//          becomes req.body = { username: "john", email: "john@test.com" }
// TOPIC: Form Data Parsing — Handling traditional HTML form submissions
// WHY: While modern apps use JSON, some forms and APIs still send URL-encoded data
//url and form data parser middleware
app.use(express.urlencoded({ extended: true }))


// ─── Middleware 3: CORS Configuration ──────────────────────────────────────
// CORS controls which domains can access this API from a browser
// origin: Specifies which frontend URL is allowed to make requests
//   - In development: 'http://localhost:5173' (Vite dev server)
//   - In production: 'https://vibefeed.com' (your deployed frontend)
// credentials: true allows cookies and authorization headers to be sent
//   - Without this, the browser won't send cookies or auth tokens
// TOPIC: CORS (Cross-Origin Resource Sharing) — Browser security policy
// WHY: Browsers enforce "Same-Origin Policy" — they block requests to different domains
//      CORS headers tell the browser "it's okay, this API trusts this frontend"
// ALTERNATIVE: Could use a proxy (Vite proxy config) to avoid CORS entirely in development
// 🔮 FUTURE: Add multiple allowed origins for staging + production environments
//cors middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}))


// ─── Middleware 4: HTTP Request Logger (Morgan) ────────────────────────────
// 'dev' format shows: :method :url :status :response-time ms - :res[content-length]
// Example output: "POST /api/v1/auth/login 200 150.456 ms - 234"
// Other formats: 'tiny', 'short', 'common', 'combined' (Apache-style)
// TOPIC: HTTP Logging — Recording API activity for debugging and monitoring
// WHY: You need to know which endpoints are being hit and how fast they respond
// ALTERNATIVE: Could use Pino-http (faster), or Winston with express-winston
// 🔮 FUTURE: Disable Morgan in production, use proper log management service
//morgan middleware
app.use(morgan('dev'))


// ─── Middleware 5: Custom Request Logger ───────────────────────────────────
// Our custom logger adds timestamps and logs to console
// This is in addition to Morgan for extra visibility
// TOPIC: Custom Middleware — Writing your own Express middleware functions
//request logger middleware
app.use(requestLogger)


// ─── HEALTH CHECK ROUTE ─────────────────────────────────────────────────────
// A simple endpoint that returns "ok" if the server is running
// Used by: load balancers, monitoring tools (Datadog, UptimeRobot), Docker health checks
// This is NOT behind authentication — anyone can check if the server is alive
// TOPIC: Health Checks — Endpoints that verify server health
// WHY: In production, you need automated tools to check if your server is running
// 🔮 FUTURE: Add checks for database connection, Redis connection, disk space, memory usage
//health check route
app.get('/health', (req, res) => {
    // res.status(200) sets the HTTP status code to 200 (OK)
    // .json() sends a JSON response and sets Content-Type header automatically
    res.status(200).json({
        status: 'ok',
        message: 'VibeFeed running 🚀',
        timestamp: new Date().toISOString() // Current time in ISO format
    })
})


// ─── API ROUTES ─────────────────────────────────────────────────────────────
// Each app.use() mounts a router at a specific path PREFIX
// Example: app.use('/api/v1/posts', postRoutes) means:
//   - A GET request to '/api/v1/posts' → postRoutes handles it
//   - A POST request to '/api/v1/posts' → postRoutes handles it
//
// 📐 URL STRUCTURE BREAKDOWN:
//   /api     → indicates this is an API endpoint (not a web page)
//   /v1      → API version 1 (allows future v2 without breaking existing clients)
//   /posts   → the RESOURCE being accessed
//
// TOPIC: API Routing — Mapping URLs to handler functions
// WHY: Organizes your API into logical groups, makes it easy to find code
// ALTERNATIVE: Could use a single routes/index.js file with all routes
//              Could use auto-loading (scan routes folder and register automatically)
//
// 🔮 FUTURE: Add API versioning (v2 routes alongside v1), API documentation endpoint

// ─── API Routes ────────────────────────────────────────────────────────────
// Auth: registration, login, get current user profile
app.use('/api/v1/auth', authRoutes)

// Users: profiles, follow/unfollow, search, suggestions, bookmarks
app.use('/api/v1/users', userRoutes)

// Posts: create, feed, explore, search, CRUD operations
app.use('/api/v1/posts', postRoutes)

// Comments: add, get, reply, update, delete comments on posts
app.use('/api/v1/comments', commentRoutes)

// Likes: like/unlike posts and comments, get who liked a post
app.use('/api/v1/likes', likeRoutes)

// Stories: create, view, delete 24-hour temporary content
app.use('/api/v1/stories', storyRoutes)

// Notifications: get, mark as read, delete notifications
app.use('/api/v1/notifications', notificationRoutes)

// Messages: conversations, send/receive real-time messages
app.use('/api/v1/messages', messageRoutes)

// Upload: file upload endpoint for images and videos
app.use('/api/v1/upload', uploadRoutes)


// ─── ERROR HANDLING MIDDLEWARE (must come AFTER all routes) ──────────────────

// ─── 404 Not Found Handler ─────────────────────────────────────────────────
// If a request reaches this point, it means NO route above matched the URL
// This middleware creates a 404 error and passes it to the error handler
// MUST be AFTER all routes — it catches anything that "falls through"
// TOPIC: 404 Handling — Telling the client they requested something that doesn't exist
//not found middleware
app.use(notFound)


// ─── Global Error Handler ──────────────────────────────────────────────────
// Express recognizes this as an error handler because it has 4 parameters
// (err, req, res, next) — the 'err' parameter is the key difference
// This catches ALL errors from routes and middleware above
// MUST be the VERY LAST middleware registered
// TOPIC: Centralized Error Handling — One place to handle all errors consistently
// WHY: Without this, errors would crash the server or send ugly HTML error pages
//error handler middleware
app.use(errorHandler)

// ─── EXPORT THE APP ─────────────────────────────────────────────────────────
// 'export default' makes this the default export of this file
// In server.js, we import it as: import app from './src/app.js'
// The app is exported WITHOUT calling .listen() — server.js handles that
// This separation allows testing the app without starting an actual server
// TOPIC: ES Module Exports — Sharing code between files
export default app