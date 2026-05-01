// ============================================================================
// 📁 FILE: like.model.js (Like Database Schema & Model)
// 📍 LOCATION: backend/src/models/like.model.js
// 📚 TOPIC: Polymorphic Associations, Unique Compound Indexes
// 🏗️ BUILD ORDER: Step 4d — Build after Post and Comment models
// ============================================================================
//
// 🎯 PURPOSE:
// Defines the Like model — tracks which user liked which content.
// Uses a POLYMORPHIC design: one Like model handles likes on BOTH Posts AND Comments.
//
// 🧠 WHAT IS POLYMORPHIC ASSOCIATION?
// Instead of creating separate models (PostLike, CommentLike), we use ONE model
// that can reference DIFFERENT collections using 'refPath'.
//
// Example:
//   Like { user: "alice", likeable: "post123", onModel: "Post" }    ← Alice liked a Post
//   Like { user: "alice", likeable: "comment456", onModel: "Comment" } ← Alice liked a Comment
//
// The 'onModel' field tells Mongoose which collection 'likeable' refers to.
// This is called a "Dynamic Reference" or "Polymorphic Reference".
//
// 🔀 ALTERNATIVE APPROACHES:
// - Separate models: PostLike and CommentLike (simpler but more code duplication)
// - Array in Post/Comment: Just use the likes array (simpler but less queryable)
// - SQL approach: Separate join tables with foreign keys
//
// 🔮 FUTURE: Add like types (❤️ 😂 😮 😢 😡) for reactions like Facebook
// ============================================================================

import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({

  // ─── user Field ──────────────────────────────────────────────────────────
  // Who performed the like action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Like must belong to a user']
  },

  // ─── likeable Field (Polymorphic Reference) ──────────────────────────────
  // The item being liked — could be a Post OR a Comment
  // 'refPath: onModel' means: "look at the 'onModel' field to know which collection this ID belongs to"
  // This is a DYNAMIC REFERENCE — the collection it points to changes based on 'onModel'
  //
  // TOPIC: Polymorphic References — One field that can reference multiple collections
  // WHY: Avoids creating separate Like models for each likeable content type
  // The liked item (Post or Comment)
  likeable: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'  // Dynamic reference — checks 'onModel' field to know which collection
  },

  // ─── onModel Field ───────────────────────────────────────────────────────
  // Tells Mongoose which collection 'likeable' refers to
  // If onModel = 'Post', then likeable is a Post ID
  // If onModel = 'Comment', then likeable is a Comment ID
  // enum restricts values to only 'Post' or 'Comment'
  onModel: {
    type: String,
    required: true,
    enum: ['Post', 'Comment']  // Only these two values are allowed
  }

}, {
  timestamps: true
})

// ─── Unique Compound Index ──────────────────────────────────────────────────
// { user: 1, likeable: 1 } with { unique: true } means:
// "The combination of user + likeable must be unique"
// This prevents a user from liking the SAME item twice
// If they try, MongoDB throws a duplicate key error
//
// Example: User "alice" + Post "post123" can only exist ONCE in the Likes collection
//
// TOPIC: Compound Unique Index — Ensuring uniqueness across multiple fields
// WHY: Without this, a user could spam-like a post by clicking rapidly
// ALTERNATIVE: Check in code before inserting (slower, race conditions possible)
// Prevent a user from liking the same item twice
likeSchema.index({ user: 1, likeable: 1 }, { unique: true })

const Like = mongoose.model('Like', likeSchema)

export default Like
