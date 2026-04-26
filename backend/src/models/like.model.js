import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Like must belong to a user']
  },

  // The liked item (Post or Comment)
  likeable: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },

  onModel: {
    type: String,
    required: true,
    enum: ['Post', 'Comment']
  }

}, {
  timestamps: true
})

// Prevent a user from liking the same item twice
likeSchema.index({ user: 1, likeable: 1 }, { unique: true })

const Like = mongoose.model('Like', likeSchema)

export default Like
