import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must belong to a user'],
    index: true
  },

  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    trim: true,
    default: ''
  },

  media: [{
    url: {
      type: String,
      required: [true, 'Media URL is required']
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  }],

  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  location: {
    type: String,
    trim: true,
    default: ''
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],

  isArchived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
})

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
  return this.likes.length
})

// Virtual for comment count
postSchema.virtual('commentCount').get(function () {
  return this.comments.length
})

// Ensure virtuals are included in JSON/Object output
postSchema.set('toJSON', { virtuals: true })
postSchema.set('toObject', { virtuals: true })

// Index for efficient feed queries (newest first by a given author)
postSchema.index({ author: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post
