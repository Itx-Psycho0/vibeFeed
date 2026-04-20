import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({

  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  isGroup: {
    type: Boolean,
    default: false
  },

  groupName: {
    type: String,
    trim: true,
    default: ''
  },

  // Cache the last message for fast inbox previews
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }

}, {
  timestamps: true
})

// Index for quickly finding all conversations a user is part of
conversationSchema.index({ participants: 1, updatedAt: -1 })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation
