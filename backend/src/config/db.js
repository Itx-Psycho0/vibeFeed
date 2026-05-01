// ============================================================================
// 📁 FILE: db.js (Database Configuration)
// 📍 LOCATION: backend/src/config/db.js
// 📚 TOPIC: MongoDB Connection using Mongoose ODM
// 🏗️ BUILD ORDER: Step 3 — Build config files AFTER app.js
// ============================================================================
//
// 🎯 PURPOSE:
// This file establishes a connection between our Node.js server and MongoDB database.
// MongoDB is a NoSQL database that stores data in JSON-like documents (not tables).
// Mongoose is an ODM (Object Data Modeling) library that makes working with MongoDB easier.
//
// 🧠 UNDERSTANDING DATABASES:
// A database is like a digital filing cabinet that stores all your application's data.
//
// SQL vs NoSQL:
//   SQL (MySQL, PostgreSQL)    → Data in TABLES with rows and columns (like Excel)
//   NoSQL (MongoDB, Firebase)  → Data in DOCUMENTS with flexible structure (like JSON)
//
// MongoDB stores data like this:
//   {
//     "_id": "abc123",             ← Auto-generated unique ID
//     "username": "psycho",
//     "email": "psycho@gmail.com",
//     "followers": ["user1", "user2"]  ← Arrays are easy in NoSQL!
//   }
//
// 🧠 WHAT IS MONGOOSE?
// Mongoose is a layer between your code and MongoDB.
// Without Mongoose: You write raw MongoDB queries (complex, no validation)
// With Mongoose: You define schemas (data shape), models, and use simple methods
//   - db.collection('users').findOne({ email: 'x' })  ← Without Mongoose (raw)
//   - User.findOne({ email: 'x' })                     ← With Mongoose (easy!)
//
// 🧠 WHAT IS MongoDB Atlas?
// MongoDB Atlas is MongoDB's CLOUD service — your database runs on their servers.
// - Free tier: 512MB storage, shared cluster
// - You get a connection string (URI) to connect from your code
// - Alternative: Run MongoDB locally with 'mongod' command
//
// 🔀 ALTERNATIVE DATABASES & APPROACHES:
// - PostgreSQL + Prisma ORM (SQL, strongly typed, great for complex relationships)
// - MySQL + Sequelize ORM (SQL, widely used, mature ecosystem)
// - Firebase Firestore (NoSQL, real-time, no server needed)
// - Supabase (open-source Firebase alternative, PostgreSQL under the hood)
// - DynamoDB (AWS NoSQL, great for serverless architectures)
// - CockroachDB (distributed SQL, great for global apps)
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add connection pooling configuration for better performance
// - Add mongoose debug mode for development (mongoose.set('debug', true))
// - Add connection retry logic with exponential backoff
// - Add multiple database support (read replicas)
// - Add database migration tools for schema changes
// - Add database indexing strategy documentation
// ============================================================================

// ─── Import Mongoose ────────────────────────────────────────────────────────
// Mongoose is the ODM (Object Data Modeling) library for MongoDB
// It provides: Schema definition, validation, middleware hooks, query building
// 'import mongoose from "mongoose"' imports the default export
// TOPIC: ODM (Object Data Modeling) — A bridge between your code and the database
import mongoose from "mongoose";

// This import is commented out because we include the DB name directly in MONGODB_URI
// In a more modular setup, you'd build the URI: `${BASE_URI}/${DB_NAME}`
// import { DB_NAME } from "../constants.js";

// ─── Database Connection Function ──────────────────────────────────────────
// 'async' keyword means this function returns a Promise and can use 'await' inside
// We use async because database connection is an I/O operation that takes time
// (it needs to travel over the network to MongoDB Atlas servers)
// TOPIC: Asynchronous Operations — Operations that don't complete instantly
const connectDB = async () => {
    try {
        // mongoose.connect() establishes a connection to the MongoDB database
        // It takes the connection string (URI) from our .env file
        //
        // The MONGODB_URI looks like:
        // mongodb+srv://username:password@cluster.mongodb.net/dbname
        //
        // Breaking down the URI:
        //   mongodb+srv:// → Protocol (SRV = Service record, auto-discovers servers)
        //   username:password → Database credentials
        //   @cluster.xyz.mongodb.net → The server address (Atlas cluster)
        //   /vibefeed → The database name
        //   ?appName=VibeFeed → Optional: helps identify connections in Atlas dashboard
        //
        // 'await' pauses execution until the connection is established or fails
        // The result 'connectionInstance' contains information about the connection
        //
        // TOPIC: Connection Strings — URLs that contain all info to connect to a database
        // WHY template literal: process.env.MONGODB_URI reads from .env file
        //     We use ${} syntax even for a single variable for consistency
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)

        // Log the successful connection with the host name
        // connectionInstance.connection.host shows which server we're connected to
        // Example: "cluster0-shard-00-00.lbmwcdq.mongodb.net"
        // This helps verify we're connected to the right database server
        console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   Database Connected                          ║
  ║   ${connectionInstance.connection.host}  ║
  ╚═══════════════════════════════════════════════╝
  `)
    } catch (err) {
        // If the connection fails (wrong credentials, network issue, Atlas is down)
        // We log the error and EXIT the process because the app can't work without a database
        // process.exit(1) terminates Node.js with error code 1
        //
        // Common connection errors:
        //   - Wrong password → Authentication failed
        //   - Wrong URI → ServerSelectionTimeoutError
        //   - Network blocked → Cannot connect (firewalls, IP whitelist)
        //   - Atlas is down → Timeout error
        //
        // 🔮 FUTURE: Add retry logic instead of immediately exiting
        //   Example: Try to reconnect 3 times with 5-second delays before giving up
        console.log("mongodb connection error", err)
        process.exit(1)
    }
}

// ─── Export the Connection Function ─────────────────────────────────────────
// 'export default' means this is the main (default) thing this file exports
// In server.js, we import it as: import connectDB from './src/config/db.js'
// Then call it: await connectDB()
// TOPIC: Module Exports — Making functions available to other files
export default connectDB;