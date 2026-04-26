import mongoose from 'mongoose'

const storySchema = new mongoose.Schema({

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Story must belong to a user'],
    index: true
  },

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

  caption: {
    type: String,
    maxlength: [200, 'Story caption cannot exceed 200 characters'],
    trim: true,
    default: ''
  },

  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }

}, {
  timestamps: true
})

// TTL index — MongoDB automatically deletes expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Index for fetching active stories by author
storySchema.index({ author: 1, createdAt: -1 })

// Virtual for viewer count
storySchema.virtual('viewerCount').get(function () {
  return this.viewers.length
})

storySchema.set('toJSON', { virtuals: true })
storySchema.set('toObject', { virtuals: true })

const Story = mongoose.model('Story', storySchema)

export default Story
