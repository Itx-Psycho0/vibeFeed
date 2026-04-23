import Like from '../models/like.model.js'
import Post from '../models/post.model.js'
import Comment from '../models/comment.model.js'

/**
 * @route   POST /api/v1/likes/post/:postId
 * @desc    Toggle like on a post
 * @access  Private
 */
export const togglePostLike = async (req, res, next) => {
  try {
    const { postId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      user: req.user._id,
      likeable: postId,
      onModel: 'Post',
    })

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id)
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: req.user._id },
      })

      return res.status(200).json({
        success: true,
        message: 'Post unliked',
        data: { liked: false },
      })
    }

    // Like
    await Like.create({
      user: req.user._id,
      likeable: postId,
      onModel: 'Post',
    })

    await Post.findByIdAndUpdate(postId, {
      $push: { likes: req.user._id },
    })

    res.status(200).json({
      success: true,
      message: 'Post liked',
      data: { liked: true },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/v1/likes/comment/:commentId
 * @desc    Toggle like on a comment
 * @access  Private
 */
export const toggleCommentLike = async (req, res, next) => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
    }

    const existingLike = await Like.findOne({
      user: req.user._id,
      likeable: commentId,
      onModel: 'Comment',
    })

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id)
      await Comment.findByIdAndUpdate(commentId, {
        $pull: { likes: req.user._id },
      })

      return res.status(200).json({
        success: true,
        message: 'Comment unliked',
        data: { liked: false },
      })
    }

    await Like.create({
      user: req.user._id,
      likeable: commentId,
      onModel: 'Comment',
    })

    await Comment.findByIdAndUpdate(commentId, {
      $push: { likes: req.user._id },
    })

    res.status(200).json({
      success: true,
      message: 'Comment liked',
      data: { liked: true },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/likes/post/:postId
 * @desc    Get all users who liked a post
 * @access  Private
 */
export const getPostLikes = async (req, res, next) => {
  try {
    const likes = await Like.find({
      likeable: req.params.postId,
      onModel: 'Post',
    }).populate('user', 'username fullName profilePicture')

    res.status(200).json({
      success: true,
      data: likes,
      total: likes.length,
    })
  } catch (error) {
    next(error)
  }
}
