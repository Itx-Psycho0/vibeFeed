// ============================================================================
// 📁 FILE: notification.model.js (Notification Database Schema & Model)
// 📍 LOCATION: backend/src/models/notification.model.js
// 📚 TOPIC: Notification System, Polymorphic References, Read Status Tracking
// 🏗️ BUILD ORDER: Step 4f — Build after User, Post, Comment models
// ============================================================================
//
// 🎯 PURPOSE:
// Defines the Notification model — tracks events that users should know about.
// Examples: "Alice liked your post", "Bob started following you", "Carol commented on your post"
//
// 🧠 HOW THE NOTIFICATION SYSTEM WORKS:
//   1. User A likes User B's post
//   2. The like controller creates a Notification document:
//      { recipient: B, sender: A, type: 'like', reference: postId, onModel: 'Post' }
//   3. Socket.io sends this notification in real-time to User B (if online)
//   4. User B sees the notification in their notification page/bell icon
//   5. User B clicks the notification → isRead becomes true
//
// 🔮 FUTURE: Add push notifications (Firebase Cloud Messaging), email notifications,
//            notification preferences (mute specific types), batch notifications
//            ("5 people liked your post" instead of 5 separate notifications)
// ============================================================================

import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({

  // ─── recipient Field ─────────────────────────────────────────────────────
  // The user who RECEIVES the notification (the one being notified)
  // index: true because we frequently query "get all notifications for user X"
  // User who receives the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient'],
    index: true  // Fast lookup: "Get all notifications for this user"
  },

  // ─── sender Field ────────────────────────────────────────────────────────
  // The user who TRIGGERED the notification (who performed the action)
  // Example: If Alice likes Bob's post, Alice is the sender, Bob is the recipient
  // User who triggered the notification
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a sender']
  },

  // ─── type Field ──────────────────────────────────────────────────────────
  // What kind of action triggered this notification
  // enum restricts to: 'like', 'comment', 'follow', 'mention'
  // The frontend uses this to show different notification messages and icons
  // TOPIC: Notification Types — Categorizing different kinds of events
  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow', 'mention']
    // 🔮 FUTURE: Add more types: 'story_reaction', 'message', 'post_share',
    //           'follow_request', 'follow_accepted', 'tag', 'live_started'
  },

  // ─── reference Field (Polymorphic) ───────────────────────────────────────
  // The entity that the notification is about (the liked post, the comment, etc.)
  // refPath: 'onModel' makes this a dynamic reference (same pattern as Like model)
  // Polymorphic reference to the relevant entity
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'  // Which collection does 'reference' point to? Check 'onModel' field
  },

  // ─── onModel Field ───────────────────────────────────────────────────────
  // Tells Mongoose which collection 'reference' belongs to
  onModel: {
    type: String,
    enum: ['Post', 'Comment', 'User']
    // 'Post': notification is about a post (like, comment on post)
    // 'Comment': notification is about a comment (reply, like on comment)
    // 'User': notification is about a user (follow)
  },

  // ─── message Field ───────────────────────────────────────────────────────
  // Optional custom message text (not currently used, but available for custom notifications)
  message: {
    type: String,
    trim: true,
    default: ''
  },

  // ─── isRead Field ────────────────────────────────────────────────────────
  // Tracks whether the user has seen/read this notification
  // false = unread (show in notification badge count)
  // true = read (already seen by user)
  // TOPIC: Read Status — Tracking which notifications have been viewed
  isRead: {
    type: Boolean,
    default: false  // All notifications start as unread
  }

}, {
  timestamps: true
})

// ─── Compound Index ─────────────────────────────────────────────────────────
// Speeds up: "Get unread notifications for user X, newest first"
// This is the most common notification query (bell icon badge count + list)
// { recipient: 1, isRead: 1, createdAt: -1 }
//   → Find by recipient, filter by read status, sort by newest
// Index for fetching unread notifications efficiently
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
