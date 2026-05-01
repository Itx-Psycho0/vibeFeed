// ============================================================================
// 📁 FILE: redis.js (Redis Cache Configuration)
// 📍 LOCATION: backend/src/config/redis.js
// 📚 TOPIC: Redis In-Memory Caching Setup
// 🏗️ BUILD ORDER: Step 3b — Build alongside db.js (config files)
// ============================================================================
//
// 🎯 PURPOSE:
// This file sets up a connection to Redis, an in-memory data store used for CACHING.
// Caching means storing frequently-accessed data in memory (RAM) for faster retrieval.
//
// 🧠 UNDERSTANDING CACHING:
// Without cache:  Client → Server → MongoDB (disk, ~10-50ms) → Server → Client
// With cache:     Client → Server → Redis (memory, ~1ms) → Server → Client
//
// Imagine a library:
//   - MongoDB = The book storage room (lots of books, takes time to find one)
//   - Redis = A desk with your most-read books (instant access!)
//
// HOW WE USE REDIS IN THIS PROJECT:
//   - Cache explore page posts (they don't change every second)
//   - When a new post is created, we clear the cache (invalidation)
//   - The cache expires after 10 minutes (TTL = Time To Live)
//
// 🧠 WHY REDIS AND NOT JUST VARIABLES?
// You might think: "Why not just store data in a JavaScript variable?"
//   - Variables are lost when the server restarts
//   - Variables are not shared between multiple server instances
//   - Redis persists data and can be shared across servers
//   - Redis has built-in expiration (data auto-deletes after N seconds)
//   - Redis supports complex data structures (lists, sets, sorted sets, hashes)
//
// 🔀 ALTERNATIVE CACHING APPROACHES:
// - Memcached (simpler than Redis, only key-value, no persistence)
// - Node.js in-memory cache (node-cache package, good for single-server)
// - CDN caching (Cloudflare, Fastly — caches at the network edge)
// - Browser caching (HTTP Cache-Control headers)
// - Database query caching (MongoDB's built-in query cache)
//
// 🔮 FUTURE IMPLEMENTATION:
// - Cache user profiles to reduce database queries
// - Cache feed posts for each user (personalized cache)
// - Use Redis for session storage (instead of JWT tokens)
// - Use Redis for rate limiting (count requests per user per minute)
// - Use Redis Pub/Sub for real-time features across multiple servers
// - Use Redis for job queues (Bull/BullMQ) for background tasks like:
//   - Sending emails, processing images, generating thumbnails
// ============================================================================

// ─── Import Redis Client ────────────────────────────────────────────────────
// 'createClient' is a named export from the 'redis' package
// Named exports use curly braces: { createClient }
// It creates a Redis client that can connect to a Redis server
// TOPIC: Redis Client — The connection object that talks to the Redis server
import { createClient } from 'redis';

// ─── Module-Level Variable ──────────────────────────────────────────────────
// 'let' allows reassignment (unlike 'const' which is fixed)
// We declare it at the module level so it's accessible by both functions below
// Initially undefined — gets assigned when connectRedis() is called
// TOPIC: Variable Scope — Where a variable can be accessed from
let redisClient;

// ─── Connect to Redis Function ─────────────────────────────────────────────
// 'export' makes this function available to other files
// This is a "named export" — imported with: import { connectRedis } from '...'
// The function checks if a Redis URL exists, and only connects if it does
// TOPIC: Optional Dependencies — Making features work even without all services
export const connectRedis = async () => {

  // Check if REDIS_URL is provided in the .env file
  // This makes Redis OPTIONAL — the app still works without it, just without caching
  // WHY: In development, you might not have Redis installed
  //      The app should still work, just without the speed boost from caching
  if (process.env.REDIS_URL) {

    // createClient() creates a new Redis client instance
    // The 'url' option contains the connection string from .env
    //
    // Redis URL format: redis://username:password@host:port
    //   redis://          → Protocol
    //   default:password  → Username:Password
    //   @redis-19240...   → Redis server address
    //   :19240            → Port number
    //
    // We use Redis Cloud (redislabs.com) which is a hosted Redis service
    // ALTERNATIVE: Run Redis locally with 'redis-server' command (free, needs installation)
    //              Use Upstash (serverless Redis, pay-per-request)
    //              Use AWS ElastiCache (managed Redis on AWS)
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    // ─── Error Event Listener ────────────────────────────────────────────
    // .on('error', callback) listens for connection errors
    // If the Redis server goes down or the connection drops, this logs the error
    // Without this handler, unhandled Redis errors could crash the app
    // TOPIC: Event-Driven Programming — Responding to events when they happen
    // ALTERNATIVE: Could use a more robust error handling with reconnection logic
    redisClient.on('error', (err) => console.log('Redis Client Error', err));

    // ─── Establish Connection ────────────────────────────────────────────
    // .connect() establishes the TCP connection to the Redis server
    // 'await' pauses until the connection is successful or throws an error
    // After this, we can use redisClient.get(), .set(), .del(), etc.
    await redisClient.connect();

    // Log successful connection
    console.log(`
          ╔══════════════════════════════════════╗
          ║   Redis Connected successfully       ║
          ╚══════════════════════════════════════╝
    `);
  } else {
    // If no REDIS_URL is found, warn the developer but DON'T crash the app
    // console.warn() prints a yellow warning (different from console.log)
    // The app continues without caching — all reads go directly to MongoDB
    console.warn('REDIS_URL not found. Running without Redis cache.');
  }
};

// ─── Get Redis Client Function ──────────────────────────────────────────────
// This function returns the Redis client instance to any file that needs it
// Returns 'undefined' if Redis is not connected (which is handled by the caller)
// Usage in controllers:
//   const redisClient = getRedisClient();
//   if (redisClient) { /* use cache */ } else { /* skip cache, use DB directly */ }
//
// TOPIC: Singleton Pattern — Having only ONE instance shared across the entire app
// WHY: We don't want multiple Redis connections — that wastes resources
// ALTERNATIVE: Could use dependency injection or a connection pool
export const getRedisClient = () => redisClient;
