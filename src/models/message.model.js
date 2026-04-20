import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({

  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message must belong to a conversation'],
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender']
  },

  text: {
    type: String,
    trim: true,
    default: ''
  },

  media: {
    url: {
      type: String,
      default: ''
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', ''],
      default: ''
    }
  },

  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true
})

// Index for paginating messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)

export default Message
