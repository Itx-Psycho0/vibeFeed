// ============================================================================
// 📁 FILE: post.model.js (Post Database Schema & Model)
// 📍 LOCATION: backend/src/models/post.model.js
// 📚 TOPIC: Post Schema, Virtuals, Indexes, Media Storage
// 🏗️ BUILD ORDER: Step 4b — Build after User model (Post depends on User)
// ============================================================================
//
// 🎯 PURPOSE:
// This file defines the Post model — the blueprint for social media posts.
// Every post in VibeFeed (images, captions, hashtags, likes, comments) follows this structure.
//
// 🧠 UNDERSTANDING POST STRUCTURE:
// A post in VibeFeed is like an Instagram post:
//   - Has an AUTHOR (who created it)
//   - Has MEDIA (images or videos)
//   - Has a CAPTION (text content)
//   - Has HASHTAGS (for discovery)
//   - Has LIKES (users who liked it)
//   - Has COMMENTS (user comments)
//   - Has a LOCATION (where it was posted from)
//
// 🧠 DOCUMENT RELATIONSHIPS IN MONGODB:
// There are two ways to relate documents:
//   1. EMBEDDING: Store related data INSIDE the document (denormalized)
//      Example: media is embedded in the post (it's part of the post document)
//   2. REFERENCING: Store only the ID and look it up (normalized)
//      Example: comments stores an array of Comment IDs (refs to another collection)
//
// When to EMBED: Data that belongs to ONE parent and is always accessed together
// When to REFERENCE: Data that can belong to multiple parents or is accessed separately
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add 'shares' field to track how many times a post was shared
// - Add 'mentions' field to tag other users in posts
// - Add 'visibility' field (public, followers-only, private)
// - Add 'scheduledAt' field for scheduled posts
// - Add 'editHistory' to track post edits
// - Add content moderation status (pending, approved, rejected)
// - Add engagement score for algorithm-based feed sorting
// ============================================================================

// Import Mongoose for schema definition
import mongoose from 'mongoose'

// ─── Define Post Schema ────────────────────────────────────────────────────
const postSchema = new mongoose.Schema({

  // ─── author Field ────────────────────────────────────────────────────────
  // The user who created this post
  // ObjectId is MongoDB's unique identifier type (a 12-byte BSON type)
  // ref: 'User' links this to the User collection for .populate()
  // required: Ensures every post has an author (no anonymous posts)
  // index: true creates a database index for faster queries when filtering by author
  // TOPIC: Database Indexes — Like a book's index, speeds up searching at the cost of storage
  // WHY index on author: We frequently query "get all posts by user X" — index makes this fast
  author: {
    type: mongoose.Schema.Types.ObjectId,    // Links to a document in another collection
    ref: 'User',                              // Which collection to reference
    required: [true, 'Post must belong to a user'], // Validation with custom error message
    index: true                               // Creates a MongoDB index for fast author lookups
  },

  // ─── caption Field ───────────────────────────────────────────────────────
  // The text content of the post (what the user writes)
  // Like Instagram's caption under a photo
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'], // Instagram's limit is 2200
    trim: true,   // Removes leading/trailing whitespace
    default: ''   // Posts can exist without a caption (just media)
  },

  // ─── media Array ─────────────────────────────────────────────────────────
  // An array of media items (images/videos) attached to the post
  // This is an EMBEDDED sub-document — the media data lives INSIDE the post
  // Each item has a URL (from Cloudinary) and a type (image or video)
  // WHY array: A post can have MULTIPLE images (like Instagram carousel)
  // WHY embedded (not referenced): Media always belongs to ONE post and is always loaded with it
  // TOPIC: Embedded Sub-documents — Nested data structures within a document
  media: [{
    url: {
      type: String,
      required: [true, 'Media URL is required']  // Each media item must have a URL
      // This URL points to Cloudinary: e.g., "https://res.cloudinary.com/df9ip2doy/image/..."
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],  // Only these two values are allowed
      default: 'image'           // Default to image if not specified
      // 'enum' is like a dropdown — restricts values to a predefined set
      // TOPIC: Enum Validation — Restricting a field to specific allowed values
    }
  }],

  // ─── hashtags Array ──────────────────────────────────────────────────────
  // Array of hashtag strings (without the # symbol)
  // Example: ["travel", "food", "photography"]
  // Used for searching and discovery (explore page)
  hashtags: [{
    type: String,
    trim: true,       // Remove whitespace
    lowercase: true   // Normalize to lowercase ("#Travel" → "travel")
    // WHY lowercase: So "#Travel" and "#travel" are treated as the same hashtag
  }],

  // ─── location Field ──────────────────────────────────────────────────────
  // Where the post was created (optional, like "Mumbai, India")
  // Simple string for now — could be enhanced with geolocation later
  location: {
    type: String,
    trim: true,
    default: ''
    // 🔮 FUTURE: Replace with GeoJSON for location-based features:
    //   location: {
    //     type: { type: String, enum: ['Point'] },
    //     coordinates: [Number]  // [longitude, latitude]
    //   }
    //   This would enable: "Find posts near me" feature
  },

  // ─── likes Array ─────────────────────────────────────────────────────────
  // Array of User IDs who liked this post
  // We store likes BOTH here and in a separate Like collection (denormalization)
  // WHY both: This array gives quick like count + check "did I like this?"
  //           The Like collection enables advanced queries and analytics
  // TOPIC: Denormalization — Storing the same data in multiple places for speed
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ─── comments Array ──────────────────────────────────────────────────────
  // Array of Comment IDs (references to the Comment collection)
  // Comments are REFERENCED (not embedded) because:
  //   - Comments can be very numerous (thousands per post)
  //   - Comments have their own complex structure (replies, likes)
  //   - We need to paginate comments separately from the post
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'  // Links to Comment collection
  }],

  // ─── isArchived Field ────────────────────────────────────────────────────
  // Soft delete — instead of actually deleting, we "archive" the post
  // Archived posts don't show in feeds but still exist in the database
  // WHY soft delete: Users might want to restore archived posts later
  // TOPIC: Soft Delete — Hiding data without permanently removing it
  isArchived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true  // Auto-adds createdAt and updatedAt fields
})

// ─── Virtual Fields ─────────────────────────────────────────────────────────
// Virtuals are fields that are COMPUTED on-the-fly, not stored in the database
// They're like Excel formulas — calculated when you access them, not stored
// WHY virtuals instead of stored fields: The count is always accurate, no sync issues
// TOPIC: Mongoose Virtuals — Computed properties that don't exist in MongoDB

// Virtual for like count — calculates from the likes array length
// Instead of storing likeCount separately (which could get out of sync),
// we compute it from the actual likes array every time
postSchema.virtual('likeCount').get(function () {
  return this.likes.length
})

// Virtual for comment count — same concept, computed from comments array
postSchema.virtual('commentCount').get(function () {
  return this.comments.length
})

// ─── Include Virtuals in Output ─────────────────────────────────────────────
// By default, virtuals are NOT included when converting to JSON or Object
// These settings ensure likeCount and commentCount appear in API responses
// toJSON: When the document is converted to JSON (res.json(post))
// toObject: When the document is converted to a plain object (post.toObject())
// TOPIC: Serialization — Converting database documents into API response format
postSchema.set('toJSON', { virtuals: true })
postSchema.set('toObject', { virtuals: true })

// ─── Compound Index ─────────────────────────────────────────────────────────
// This creates a COMPOUND INDEX on { author, createdAt }
// It speeds up queries like: "Get all posts by user X, sorted by newest first"
// The '1' means ascending order, '-1' means descending (newest first)
//
// 🧠 HOW INDEXES WORK:
// Without index: MongoDB scans EVERY document to find matches (slow with millions of docs)
// With index: MongoDB uses a sorted data structure (B-tree) to find matches quickly
//
// Think of it like a phone book:
//   Without index: Read every entry to find "Smith" (slow)
//   With index: Jump to "S" section, then find "Smith" (fast!)
//
// TRADEOFF: Indexes speed up reads but slow down writes (the index must be updated too)
//           Only add indexes for queries you run frequently
//
// TOPIC: Database Indexing — Optimizing query performance
// Index for efficient feed queries (newest first by a given author)
postSchema.index({ author: 1, createdAt: -1 })

// ─── Create and Export Model ────────────────────────────────────────────────
// Creates the 'Post' model and the 'posts' collection in MongoDB
const Post = mongoose.model('Post', postSchema)

export default Post
