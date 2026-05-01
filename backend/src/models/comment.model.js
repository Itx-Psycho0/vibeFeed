// ============================================================================
// 📁 FILE: comment.model.js (Comment Database Schema & Model)
// 📍 LOCATION: backend/src/models/comment.model.js
// 📚 TOPIC: Comment Schema, Self-Referencing (Nested Replies), Virtuals
// 🏗️ BUILD ORDER: Step 4c — Build after Post model (Comments belong to Posts)
// ============================================================================
//
// 🎯 PURPOSE:
// Defines the Comment model — how comments on posts are stored in MongoDB.
// Supports NESTED REPLIES (comments on comments) using self-referencing.
//
// 🧠 SELF-REFERENCING PATTERN:
// A comment can be a reply to another comment (like Reddit threads).
// The 'parentComment' field points to another Comment document.
//   - Top-level comment: parentComment = null
//   - Reply to a comment: parentComment = <parent comment's ID>
//
// Example thread:
//   Comment A (parentComment: null)     ← Top-level
//     └─ Comment B (parentComment: A)   ← Reply to A
//         └─ Comment C (parentComment: B) ← Reply to B
//
// 🔀 ALTERNATIVE FOR NESTED COMMENTS:
// - Materialized Path: Store full path like "A/B/C" for deep nesting
// - Nested Sets: Numeric left/right values for tree traversal
// - Adjacency List (what we use): Simple parent reference — best for shallow nesting
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add 'mentions' field to tag users in comments (@username)
// - Add 'edited' boolean flag to show if comment was edited
// - Add 'isHidden' for content moderation
// - Add reaction types beyond just likes (❤️ 😂 😮 😢 😡)
// ============================================================================

import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({

  // ─── post Field ──────────────────────────────────────────────────────────
  // Which post this comment belongs to
  // Every comment MUST be attached to a post
  // index: true speeds up "get all comments for post X" queries
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',                                    // References the Post collection
    required: [true, 'Comment must belong to a post'],
    index: true                                     // Fast lookup: "comments for this post"
  },

  // ─── author Field ────────────────────────────────────────────────────────
  // The user who wrote this comment
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',                                    // References the User collection
    required: [true, 'Comment must have an author']
  },

  // ─── text Field ──────────────────────────────────────────────────────────
  // The actual comment content (what the user typed)
  text: {
    type: String,
    required: [true, 'Comment text is required'],    // Can't have an empty comment
    trim: true,                                      // Remove extra whitespace
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },

  // ─── parentComment Field (Self-Referencing) ──────────────────────────────
  // This enables NESTED REPLIES — a comment can be a reply to another comment
  // If this is null → it's a top-level comment (directly on the post)
  // If this has a value → it's a reply to another comment
  //
  // Self-referencing means: This field points to ANOTHER document in the SAME collection
  // ref: 'Comment' points to this same Comment model
  //
  // TOPIC: Self-Referencing Documents — A document that references its own collection
  // WHY: Enables threaded conversations without creating a separate "Reply" collection
  // Self-referencing for nested replies
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',   // Points to another Comment document
    default: null      // null = top-level comment, has a value = it's a reply
  },

  // ─── likes Array ─────────────────────────────────────────────────────────
  // Users who liked this comment (same pattern as Post likes)
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true  // createdAt and updatedAt auto-generated
})

// ─── Virtual: Like Count ────────────────────────────────────────────────────
// Computed on-the-fly from the likes array length
// Not stored in DB — always accurate
// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
  return this.likes.length
})

// Include virtuals in JSON and Object output
commentSchema.set('toJSON', { virtuals: true })
commentSchema.set('toObject', { virtuals: true })

// ─── Compound Index ─────────────────────────────────────────────────────────
// Speeds up: "Get all comments on post X, sorted by oldest first"
// { post: 1, createdAt: 1 } → ascending (oldest first for comments)
// We show comments oldest-first (chronological) unlike posts which are newest-first
// Index for fetching comments on a post in chronological order
commentSchema.index({ post: 1, createdAt: 1 })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
