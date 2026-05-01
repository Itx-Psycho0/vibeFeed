// ============================================================================
// 📁 FILE: user.model.js (User Database Schema & Model)
// 📍 LOCATION: backend/src/models/user.model.js
// 📚 TOPIC: Mongoose Schema Definition, Password Hashing, Data Modeling
// 🏗️ BUILD ORDER: Step 4a — Build models AFTER config files, BEFORE controllers
// ============================================================================
//
// 🎯 PURPOSE:
// This file defines the User model — the blueprint for how user data is stored
// in MongoDB. Every user in VibeFeed (their username, email, password, followers, etc.)
// follows this exact structure.
//
// 🧠 UNDERSTANDING MODELS & SCHEMAS:
// Schema = The BLUEPRINT (defines what fields exist, their types, and rules)
// Model = The CONSTRUCTOR (creates, reads, updates, deletes documents using the schema)
//
// Think of it like a cookie cutter:
//   Schema = The cookie cutter shape (defines the structure)
//   Model = The factory that uses the cutter to make cookies (documents)
//   Document = One individual cookie (one user record)
//
// 🧠 WHAT IS A MONGOOSE SCHEMA?
// A Mongoose Schema defines:
//   - FIELDS: What data each user has (username, email, etc.)
//   - TYPES: What type of data each field holds (String, Number, Boolean, etc.)
//   - VALIDATION: Rules that data must follow (required, min/max length, pattern)
//   - DEFAULTS: Values used when the field is not provided
//   - REFERENCES: Links to other collections (like foreign keys in SQL)
//
// 🧠 MONGODB COLLECTION vs SQL TABLE:
//   SQL:     Users TABLE → Each row is a user → Fixed columns
//   MongoDB: Users COLLECTION → Each document is a user → Flexible fields
//
// 🔀 ALTERNATIVE APPROACHES:
// - Prisma (TypeScript-first ORM, works with SQL and MongoDB)
// - TypeORM (decorators-based ORM for TypeScript)
// - Sequelize (popular SQL ORM for Node.js)
// - Drizzle ORM (lightweight, TypeScript-first)
// - Raw MongoDB driver (no ORM, more control, more code to write)
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add role field (admin, moderator, user) for authorization
// - Add email verification (isEmailVerified + verification token)
// - Add OAuth fields (googleId, githubId) for social login
// - Add 2FA (two-factor authentication) fields
// - Add account status (active, suspended, banned)
// - Add last login timestamp
// - Add password reset token and expiry
// - Add notification preferences (email, push, in-app)
// ============================================================================

// ─── Import Mongoose ────────────────────────────────────────────────────────
// Mongoose provides schema definition, validation, and query building
// It's our ODM (Object Data Modeling) layer between Node.js and MongoDB
import mongoose from 'mongoose'

// ─── Import Bcrypt for Password Hashing ─────────────────────────────────────
// bcryptjs is a pure JavaScript implementation of bcrypt (password hashing algorithm)
// WHY bcryptjs instead of bcrypt?
//   - bcrypt requires native C++ compilation (can fail on some systems)
//   - bcryptjs is pure JS, works everywhere, slightly slower but more portable
//   - Both do the same thing: hash passwords securely
// TOPIC: Password Hashing — Converting plaintext passwords into unreadable strings
// WHY: NEVER store passwords in plain text! If your database is hacked,
//      hackers would see everyone's actual passwords.
//      Hashed passwords are one-way — you can't reverse them back to the original
import bcrypt from 'bcryptjs'

// ─── Define User Schema ────────────────────────────────────────────────────
// new mongoose.Schema({...}) creates a new schema definition
// The object inside defines all the fields and their rules
// The second argument { timestamps: true } is the schema options
const userSchema = new mongoose.Schema({

  // ─── username Field ──────────────────────────────────────────────────────
  // A unique identifier for each user (like @psycho on Twitter/Instagram)
  username: {
    type: String,                                          // Data type: JavaScript String
    required: [true, 'Username is required'],              // Field is mandatory; custom error message
    unique: true,                                          // No two users can have the same username (creates DB index)
    trim: true,                                            // Removes whitespace from both ends ("  psycho  " → "psycho")
    lowercase: true,                                       // Converts to lowercase ("Psycho" → "psycho")
    minlength: [3, 'Username must be at least 3 characters'],     // Minimum 3 characters
    maxlength: [30, 'Username cannot exceed 30 characters'],       // Maximum 30 characters
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    // ^ 'match' uses a Regular Expression (regex) to validate the format
    // /^[a-zA-Z0-9_]+$/ means: only letters (a-z, A-Z), numbers (0-9), and underscore (_)
    // ^ = start of string, $ = end of string, + = one or more characters
    // TOPIC: Regular Expressions (regex) — Patterns for matching text
  },

  // ─── email Field ─────────────────────────────────────────────────────────
  // User's email address — used for login and communication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                                          // Each email can only be used once
    trim: true,                                            // Remove extra whitespace
    lowercase: true,                                       // "John@Gmail.COM" → "john@gmail.com"
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    // This regex validates basic email format: something@something.something
    // [^\s@] means "any character that is NOT whitespace or @"
    // 🔮 FUTURE: Use a more robust email validation library like 'validator' or 'email-validator'
    //           This regex doesn't catch all invalid emails (e.g., test@.com would fail)
  },

  // ─── password Field ──────────────────────────────────────────────────────
  // The user's hashed password (NEVER stored in plain text!)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false   // ← THIS IS CRITICAL FOR SECURITY!
    // 'select: false' means this field is EXCLUDED from all query results by default
    // When you do User.find() or User.findById(), the password won't be included
    // To include it, you must explicitly do: User.findOne({ email }).select('+password')
    // TOPIC: Data Security — Preventing sensitive data from leaking in API responses
    // WHY: Even internal API responses shouldn't contain password hashes
  },

  // ─── fullName Field ──────────────────────────────────────────────────────
  // The user's display name (e.g., "Anurag Kumar")
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },

  // ─── bio Field ───────────────────────────────────────────────────────────
  // A short description/status message (like Instagram bio)
  bio: {
    type: String,
    maxlength: [250, 'Bio cannot exceed 250 characters'],
    trim: true,
    default: ''     // If not provided, default to empty string (not null/undefined)
    // TOPIC: Default Values — What to use when the user doesn't provide a value
  },

  // ─── profilePicture Field ────────────────────────────────────────────────
  // URL to the user's profile picture (stored on Cloudinary)
  // We store the URL string, not the actual image file!
  profilePicture: {
    type: String,
    default: ''     // Empty string means no profile picture (show placeholder in frontend)
    // 🔮 FUTURE: Add a default avatar URL (like Gravatar or UI Avatars API)
  },

  // ─── isVerified Field ────────────────────────────────────────────────────
  // Whether the user has a verification badge (like Twitter/Instagram blue check)
  isVerified: {
    type: Boolean,   // true or false
    default: false   // New users start as unverified
    // 🔮 FUTURE: Add email verification flow (send email with verification link)
  },

  // ─── isPrivate Field ─────────────────────────────────────────────────────
  // Whether the user's profile is private (followers-only content)
  isPrivate: {
    type: Boolean,
    default: false   // Profiles are public by default
    // 🔮 FUTURE: Implement follow request system for private profiles
    //           Private profiles should require approval before someone can follow
  },

  // ─── followers Array ─────────────────────────────────────────────────────
  // Array of User IDs who follow this user
  // mongoose.Schema.Types.ObjectId is MongoDB's unique identifier type (24-character hex string)
  // 'ref: User' tells Mongoose that these IDs refer to the User collection
  // This enables .populate() to replace IDs with actual user documents
  // TOPIC: References & Population — Linking documents across collections (like JOINs in SQL)
  //
  // Example without populate: followers: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439022"]
  // Example with populate: followers: [{ _id: "...", username: "john", ... }, { ... }]
  //
  // 🔮 FUTURE: Move followers to a separate collection for better scalability
  //           With millions of followers, storing them in an array becomes slow
  //           A separate "Follow" collection with { follower, following } documents is better
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ─── following Array ─────────────────────────────────────────────────────
  // Array of User IDs that this user follows
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ─── posts Array ─────────────────────────────────────────────────────────
  // Array of Post IDs created by this user
  // ref: 'Post' links to the Post model (defined in post.model.js)
  posts:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

  // ─── bookmarks Array ─────────────────────────────────────────────────────
  // Array of Post IDs that this user has bookmarked/saved
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]

}, {
  // ─── Schema Options ──────────────────────────────────────────────────────
  // timestamps: true automatically adds two fields to every document:
  //   createdAt: Date when the user was created (e.g., "2024-01-15T10:30:00Z")
  //   updatedAt: Date when the user was last modified (auto-updates on .save())
  // TOPIC: Timestamps — Automatically tracking when data was created/modified
  // WHY: Important for sorting, auditing, and debugging
  timestamps: true  // auto createdAt + updatedAt
})

// ─── Pre-Save Middleware (Password Hashing) ─────────────────────────────────
// .pre('save', fn) is a Mongoose MIDDLEWARE HOOK — it runs BEFORE .save() is called
// This automatically hashes the password every time a user is created or password is changed
//
// 🧠 HOW PASSWORD HASHING WORKS:
//   1. User enters password: "mypassword123"
//   2. bcrypt generates a random "salt": "$2a$10$N9qo8uLOickgx2ZMRZoMye"
//   3. bcrypt combines password + salt and hashes them:
//      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//   4. This hash is stored in the database (not the original password)
//   5. When logging in, bcrypt compares the entered password with the stored hash
//
// 🧠 WHAT IS A SALT?
// A salt is random data added to the password before hashing
// WHY: Without salt, two users with the same password would have the same hash
//      Hackers could use "rainbow tables" (pre-computed hashes) to crack passwords
//      Salt makes each hash unique even for the same password
//
// TOPIC: Mongoose Middleware / Hooks — Code that runs automatically at specific points
// WHY 'function()' instead of arrow function: We need 'this' to refer to the user document
//     Arrow functions don't have their own 'this' — they inherit from the parent scope
//     Regular functions bind 'this' to the document being saved
// Hash password before saving
userSchema.pre('save', async function() {
  // isModified('password') checks if the password field was changed
  // We only hash if the password was changed (not on every save!)
  // Without this check, the already-hashed password would get hashed AGAIN on profile updates
  if (!this.isModified('password')) return

  // genSalt(10) generates a salt with 10 "rounds" of processing
  // Higher rounds = more secure but slower (10 is the standard recommendation)
  // 10 rounds ≈ 10 hashes/second, 12 rounds ≈ 3 hashes/second
  const salt = await bcrypt.genSalt(10)

  // hash(password, salt) creates the final hash
  // 'this.password' is the plain text password the user entered
  // After this line, this.password becomes the hashed version
  this.password = await bcrypt.hash(this.password, salt)
})

// ─── Instance Method: Compare Passwords ─────────────────────────────────────
// .methods adds custom methods to every document instance
// This method is called during LOGIN to verify the entered password
// It compares the plain text password with the stored hash
// Returns true if they match, false if they don't
//
// Usage in auth.controller.js:
//   const isMatch = await user.comparePassword(enteredPassword)
//
// TOPIC: Instance Methods — Custom functions available on every document
// WHY: Encapsulates password comparison logic in the model (keeps controller clean)
// Compare passwords — used in Login
userSchema.methods.comparePassword = async function(enteredPassword) {
  // bcrypt.compare() takes the plain password and the hash
  // It extracts the salt from the hash, hashes the entered password with it,
  // and checks if the results match
  // Returns a boolean: true if passwords match, false otherwise
  return await bcrypt.compare(enteredPassword, this.password)
}

// ─── Create the Model ───────────────────────────────────────────────────────
// mongoose.model('User', userSchema) does two things:
//   1. Creates a Model class from the schema (we can use User.find(), User.create(), etc.)
//   2. Creates a MongoDB collection called "users" (lowercase + plural, by convention)
// TOPIC: Mongoose Model — The interface for interacting with a MongoDB collection
// The 'User' string MUST match the ref: 'User' used in other schemas
const User = mongoose.model('User', userSchema)

// ─── Export the Model ───────────────────────────────────────────────────────
// Other files import this to create, find, update, and delete user documents
// Example: import User from '../models/user.model.js'
//          const user = await User.findById(userId)
export default User