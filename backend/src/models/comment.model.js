import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment must belong to a post'],
    index: true
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author']
  },

  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },

  // Self-referencing for nested replies
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true
})

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
  return this.likes.length
})

commentSchema.set('toJSON', { virtuals: true })
commentSchema.set('toObject', { virtuals: true })

// Index for fetching comments on a post in chronological order
commentSchema.index({ post: 1, createdAt: 1 })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
