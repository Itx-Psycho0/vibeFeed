// ============================================================================
// 📁 FILE: story.model.js (Story Database Schema & Model)
// 📍 LOCATION: backend/src/models/story.model.js
// 📚 TOPIC: TTL Index (Auto-Expiring Documents), Temporary Content
// 🏗️ BUILD ORDER: Step 4e — Build after User model
// ============================================================================
//
// 🎯 PURPOSE:
// Defines the Story model — 24-hour temporary content (like Instagram/Snapchat stories).
// Stories automatically DELETE themselves from MongoDB after 24 hours using a TTL index.
//
// 🧠 WHAT IS A TTL (Time To Live) INDEX?
// TTL is a special MongoDB index that AUTOMATICALLY deletes documents after a specified time.
// You set an expiration date on a document, and MongoDB's background thread removes it.
// No cron jobs, no cleanup scripts — MongoDB handles it automatically!
//
// HOW IT WORKS:
//   1. Story is created with expiresAt = now + 24 hours
//   2. MongoDB checks expired documents every ~60 seconds
//   3. When a story's expiresAt is in the past, MongoDB deletes it automatically
//
// 🔮 FUTURE: Add story reactions, story replies, story highlights (save past 24hrs)
// ============================================================================

import mongoose from 'mongoose'

const storySchema = new mongoose.Schema({

  // ─── author Field ────────────────────────────────────────────────────────
  // The user who posted this story
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Story must belong to a user'],
    index: true  // Fast lookup: "Get all stories by user X"
  },

  // ─── media Field (Embedded Object) ───────────────────────────────────────
  // Unlike Post's media (which is an array), Story has ONE media item
  // This is an embedded object (not an array) — each story has exactly one image/video
  media: {
    url: {
      type: String,
      required: [true, 'Story media URL is required']
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  },

  // ─── caption Field ───────────────────────────────────────────────────────
  // Optional text overlay on the story
  caption: {
    type: String,
    maxlength: [200, 'Story caption cannot exceed 200 characters'], // Shorter than post captions
    trim: true,
    default: ''
  },

  // ─── viewers Array ───────────────────────────────────────────────────────
  // Tracks which users have viewed this story
  // Unlike likes, viewers is a one-time record (viewing again doesn't add a duplicate)
  // Only the story author can see the viewers list (privacy feature)
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ─── expiresAt Field ─────────────────────────────────────────────────────
  // The date/time when this story should be automatically deleted
  // 'default' uses a function that calculates "now + 24 hours"
  //
  // Date.now() returns current time in milliseconds since Jan 1, 1970 (Unix epoch)
  // 24 * 60 * 60 * 1000 = 86,400,000 milliseconds = 24 hours
  //
  // TOPIC: Date Arithmetic — Calculating future dates using milliseconds
  // WHY a function: If we used Date.now() + 24*60*60*1000 directly (without the arrow function),
  //                 it would compute the time ONCE when the schema is defined, not when each story is created
  //                 The arrow function () => ... runs EACH TIME a new story is created
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }

}, {
  timestamps: true
})

// ─── TTL Index (Auto-Delete Expired Documents) ──────────────────────────────
// expireAfterSeconds: 0 means "delete when the field's date has passed"
// MongoDB runs a background thread that checks for expired documents every ~60 seconds
// This is the magic that makes stories disappear after 24 hours!
//
// HOW IT WORKS:
//   1. Story created at 10:00 AM → expiresAt = 10:00 AM + 24hrs = tomorrow 10:00 AM
//   2. At tomorrow ~10:01 AM, MongoDB's TTL thread deletes this document
//
// TOPIC: TTL Index — MongoDB's built-in document expiration feature
// WHY: Perfect for temporary content (stories, OTPs, session tokens, password reset links)
// ALTERNATIVE: Run a cron job that deletes expired stories every minute (more complex, less reliable)
// TTL index — MongoDB automatically deletes expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Speed up: "Get active stories by user X, newest first"
// Index for fetching active stories by author
storySchema.index({ author: 1, createdAt: -1 })

// ─── Virtual: Viewer Count ──────────────────────────────────────────────────
// Virtual for viewer count
storySchema.virtual('viewerCount').get(function () {
  return this.viewers.length
})

storySchema.set('toJSON', { virtuals: true })
storySchema.set('toObject', { virtuals: true })

const Story = mongoose.model('Story', storySchema)

export default Story
