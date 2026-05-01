// ============================================================================
// 📁 FILE: message.model.js (Chat Message Schema)
// 📍 LOCATION: backend/src/models/message.model.js
// 📚 TOPIC: Real-Time Messaging, Read Receipts, Media Messages
// 🏗️ BUILD ORDER: Step 4h — Build alongside Conversation model
// ============================================================================
//
// 🎯 PURPOSE: Defines individual messages within a conversation.
// Each message belongs to a conversation, has a sender, and optional media.
//
// 🔮 FUTURE: Message reactions, message editing, message deletion,
//            voice messages, file attachments, message forwarding
// ============================================================================

import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  // Which conversation this message belongs to
  // index: true for fast "get messages in conversation X" queries
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message must belong to a conversation'],
    index: true
  },

  // Who sent this message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender']
  },

  // Text content of the message
  text: { type: String, trim: true, default: '' },

  // Optional media attachment (image or video)
  media: {
    url: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video', ''], default: '' }
  },

  // Which users have read this message
  // TOPIC: Read Receipts — tracking who has seen a message (like WhatsApp blue ticks)
  // When a message is sent, only the sender is in readBy
  // When others view it, their IDs are added
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true })

// Speed up: "Get messages in conversation X, sorted by newest"
// Index for paginating messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)
export default Message
