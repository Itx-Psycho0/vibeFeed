import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({

  // User who receives the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient'],
    index: true
  },

  // User who triggered the notification
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a sender']
  },

  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow', 'mention']
  },

  // Polymorphic reference to the relevant entity
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },

  onModel: {
    type: String,
    enum: ['Post', 'Comment', 'User']
  },

  message: {
    type: String,
    trim: true,
    default: ''
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
})

// Index for fetching unread notifications efficiently
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
