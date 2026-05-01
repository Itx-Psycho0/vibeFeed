// ============================================================================
// 📁 FILE: conversation.model.js (Chat Room Schema)
// 📍 LOCATION: backend/src/models/conversation.model.js
// 📚 TOPIC: Chat System, Group Chats, Last Message Caching
// 🏗️ BUILD ORDER: Step 4g — Build alongside Message model
// ============================================================================
//
// 🎯 PURPOSE:
// Defines the Conversation model — a chat room between users.
// Stores participants and caches the last message for fast inbox previews.
//
// 🔮 FUTURE: Group admin roles, pinned messages, muted/archived conversations
// ============================================================================

import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  // Array of users in this chat (2 for DM, 3+ for group)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  // Is this a group chat or 1-on-1 DM?
  isGroup: { type: Boolean, default: false },

  // Group chat name (only for groups)
  groupName: { type: String, trim: true, default: '' },

  // Cache last message for fast inbox display (avoids querying Messages collection)
  // TOPIC: Denormalization — storing redundant data for speed
  // Cache the last message for fast inbox previews
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true })

// Speed up: "Get all conversations for user X, sorted by most recent"
// Index for quickly finding all conversations a user is part of
conversationSchema.index({ participants: 1, updatedAt: -1 })

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation
