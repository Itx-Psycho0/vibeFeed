// ============================================================================
// 📁 FILE: server.js
// 📍 LOCATION: backend/server.js (THE ENTRY POINT — This runs FIRST!)
// 📚 TOPIC: Server Bootstrap / Application Entry Point
// 🏗️ BUILD ORDER: This is Step 1 — Build this FIRST when starting a backend
// ============================================================================
//
// 🎯 PURPOSE:
// This is the MAIN file that starts your entire backend application.
// When you run "node server.js" or "npm run dev", THIS file executes first.
// It's like the ignition key of a car — without it, nothing starts.
//
// 📖 WHAT HAPPENS WHEN THIS FILE RUNS (in order):
// 1. Load environment variables from .env file
// 2. Import the database connection function
// 3. Import the Redis (cache) connection function
// 4. Import the Express app (with all routes and middleware)
// 5. Connect to MongoDB database
// 6. Connect to Redis cache
// 7. Start the HTTP server on a port (e.g., 8000)
// 8. Initialize Socket.io for real-time features
// 9. Set up graceful shutdown handlers
//
// 💡 WHY SEPARATE server.js AND app.js?
// - "Separation of Concerns" design principle
// - server.js handles: starting the server, database connections, process management
// - app.js handles: Express configuration, routes, middleware
// - This separation makes testing easier — you can import app.js without starting a server
// - In production, you might have different server configurations
//
// 🔀 ALTERNATIVE APPROACHES:
// - Could combine server.js and app.js into one file (simpler but less organized)
// - Could use TypeScript instead of JavaScript for type safety
// - Could use a framework like NestJS that handles this automatically
// - Could use Deno or Bun instead of Node.js as the runtime
// ============================================================================

// ─── STEP 1: Load Environment Variables ────────────────────────────────────
// 'dotenv' is a library that reads the .env file and loads its values into process.env
// process.env is a global object in Node.js that stores environment variables
// We import it FIRST because other modules might need these variables during import
// TOPIC: Environment Variables — Secret/config values that change between environments
// WHY: Never hardcode passwords, API keys, or secrets in your code!
// ALTERNATIVE: Could use 'cross-env' for setting env vars, or Docker env files
import dotenv from "dotenv";

// This line actually reads the .env file and makes variables available
// After this, process.env.PORT, process.env.MONGODB_URI, etc. are all accessible
// .config() must be called BEFORE any code that uses process.env values
dotenv.config();

// ─── STEP 2: Import Database Connection ────────────────────────────────────
// This imports our custom function to connect to MongoDB
// The '.js' extension is required when using ES Modules ("type": "module" in package.json)
// TOPIC: Database Connection — How the server talks to the database
// WHY: The database stores all our data (users, posts, comments, etc.)
import connectDB from "./src/config/db.js";

// ─── STEP 3: Import Redis Connection ───────────────────────────────────────
// Redis is an in-memory database used for CACHING (storing frequently-accessed data in memory)
// Using { connectRedis } with curly braces = "named import" (the function was exported by name)
// Without curly braces = "default import" (like connectDB above)
// TOPIC: Caching — Making your app faster by storing data in memory
// WHY: Reading from memory (Redis) is 100x faster than reading from disk (MongoDB)
// ALTERNATIVE: Could use Memcached, or skip caching entirely for simpler apps
import { connectRedis } from "./src/config/redis.js";

// ─── STEP 4: Import Express Application ────────────────────────────────────
// This imports our configured Express application with all middleware and routes
// 'app' is the Express instance that knows how to handle HTTP requests
// TOPIC: Express.js — The web framework that handles HTTP requests
import app from "./src/app.js"

// ─── STEP 5: Define the Port ───────────────────────────────────────────────
// The PORT is the "door number" where our server listens for incoming requests
// process.env.PORT reads from .env file; if not found, defaults to 8000
// The || operator means "use the left value, but if it's undefined/null, use the right value"
// Common ports: 3000 (React), 5173 (Vite), 8000/8080 (Backend APIs), 80 (HTTP), 443 (HTTPS)
// TOPIC: Networking — How computers communicate over ports
// WHY: Each service needs its own unique port number, like apartments in a building
const port = process.env.PORT || 8000;


// ─── STEP 6: Create and Start the Server ───────────────────────────────────
// We wrap everything in an async function because database connections are asynchronous
// (they take time and we need to wait for them using 'await')
// TOPIC: Async/Await — Handling operations that take time (like network requests)
// WHY: We can't start the server before the database is connected!
const createServer = async () => {
    // try...catch is error handling — if anything fails, the catch block handles it
    // TOPIC: Error Handling — Gracefully dealing with failures
    // WHY: Without try/catch, an error would crash the entire application silently
    try{
        // ─── STEP 6a: Connect to MongoDB Database ──────────────────────────
        // 'await' pauses execution until the database connection is established
        // If the connection fails, it throws an error caught by the catch block
        // This MUST succeed before the server starts accepting requests
        // TOPIC: Database Connection — Establishing a link to MongoDB Atlas (cloud database)
        //database connection
        await connectDB();
        
        // ─── STEP 6b: Connect to Redis Cache ──────────────────────────────
        // Redis connection is also awaited — we want caching ready before serving requests
        // Unlike MongoDB, Redis is optional — the app works without it, just slower
        // TOPIC: Redis Cache — In-memory key-value store for performance
        //redis connection
        await connectRedis();

        // ─── STEP 6c: Start HTTP Server ────────────────────────────────────
        // app.listen() starts the Express server on the specified port
        // The callback function runs once the server successfully starts
        // 'server' variable stores the HTTP server instance (needed for Socket.io later)
        // TOPIC: HTTP Server — The actual process that receives and responds to web requests
        // WHY we store in 'server' variable: Socket.io needs the HTTP server to upgrade
        // connections from HTTP to WebSocket protocol
        // ALTERNATIVE: Could use 'http.createServer(app)' for more control
        //server
        const server = app.listen(port, () => {
            // Template literals (backtick strings) allow embedded expressions with ${}
            // This fancy box just makes the console output look professional
            console.log(`
          ╔══════════════════════════════════════╗
          ║   VibeFeed Server Running            ║
          ║   http://localhost:${port}              ║
          ║   Environment: ${process.env.NODE_ENV}           ║
          ╚══════════════════════════════════════╝
          `)
        })

        // ─── STEP 6d: Initialize Socket.io for Real-Time Features ──────────
        // Dynamic import() loads the socket module AFTER the server starts
        // We use dynamic import so Socket.io initializes only when the server is ready
        // .then() is a Promise handler — it runs after the import completes
        // TOPIC: WebSockets / Socket.io — Real-time bidirectional communication
        // WHY: Normal HTTP is request-response (client asks, server answers)
        //      WebSockets keep a persistent connection open for instant data push
        //      Used for: live chat, real-time notifications, online status
        // ALTERNATIVE: Could use Server-Sent Events (SSE) for one-way real-time data
        //              Could use WebRTC for peer-to-peer communication (video calls)
        //              Could use Firebase Realtime Database or Supabase Realtime
        // 🔮 FUTURE: Add WebSocket rooms for group chats, typing indicators,
        //            read receipts, live post reactions, video/voice calls
        // Initialize Socket.io
        import("./src/socket/index.js").then((socketModule) => {
            // initSocket receives the HTTP server and creates WebSocket upgrade capability
            socketModule.initSocket(server);
            console.log("Socket.io Initialized");
        });

        // ─── STEP 6e: Graceful Shutdown Handlers ───────────────────────────
        // These handle unexpected crashes and termination signals
        // TOPIC: Process Management — Ensuring the server shuts down cleanly
        // WHY: Without graceful shutdown, open database connections might corrupt data,
        //      ongoing requests might fail, and resources might leak

        // 'unhandledRejection' fires when a Promise is rejected but no .catch() handles it
        // This is a safety net — ideally, every Promise should have error handling
        // We close the server and exit with code 1 (1 = error, 0 = success)
        // FUTURE: Add proper logging (e.g., Winston or Pino) instead of console.log
        // graceful shutdown        
        process.on("unhandledRejection", (err) => {
            console.log("unhandled rejection", err)
            // server.close() stops accepting new connections, then waits for existing ones to finish
            server.close(() => process.exit(1))
        })

        // 'SIGTERM' is a termination signal sent by the OS or process managers (like Docker, PM2)
        // It means "please shut down gracefully" (unlike SIGKILL which forces immediate stop)
        // Exit code 0 = clean/successful shutdown
        // TOPIC: Unix Signals — How the operating system communicates with processes
        // WHY: In production (Docker, Kubernetes, Heroku), the platform sends SIGTERM
        //      before killing your app, giving it time to clean up
        process.on('SIGTERM', () => {
        server.close(() => process.exit(0))
        })
    }
    catch(err){
        // If ANY of the above steps fail (DB connection, Redis connection, server start),
        // we log the error and exit the process with code 1 (error)
        // process.exit(1) terminates the Node.js process entirely
        // In production, a process manager like PM2 would restart the app automatically
        console.log("error", err.message)
        process.exit(1)
    }
}

// ─── STEP 7: Execute the Server Creation ───────────────────────────────────
// This actually calls the function defined above to start everything
// Without this line, the function would be defined but never executed!
// TOPIC: Function Invocation — Calling a function to execute its code
createServer();

// ============================================================================
// 🔮 FUTURE IMPLEMENTATION IDEAS:
// ============================================================================
// 1. CLUSTERING: Use Node.js 'cluster' module to run multiple server instances
//    on different CPU cores for better performance
//    WHY: Node.js is single-threaded, clustering uses all CPU cores
//
// 2. HTTPS: Add SSL/TLS certificate for encrypted connections
//    WHY: Required for production, protects user data in transit
//    HOW: Use 'https.createServer(sslOptions, app)' instead of app.listen()
//
// 3. RATE LIMITING: Add 'express-rate-limit' to prevent abuse/DDoS attacks
//    WHY: Stops malicious users from making too many requests
//
// 4. LOGGING: Replace console.log with Winston or Pino for structured logging
//    WHY: Professional logging with levels (error, warn, info, debug), file output,
//         and integration with log management services (Datadog, Loggly)
//
// 5. HEALTH CHECKS: More comprehensive health endpoints checking DB, Redis, etc.
//    WHY: Load balancers and monitoring tools use these to know if the server is healthy
//
// 6. DOCKER: Containerize the application with a Dockerfile
//    WHY: Consistent environment across development, staging, and production
//
// 7. CI/CD: Set up GitHub Actions for automated testing and deployment
//    WHY: Automatically test and deploy code when you push to GitHub
// ============================================================================
