import Comment from '../models/comment.model.js'
import Post from '../models/post.model.js'
import Notification from '../models/notification.model.js'
import { getIO, getReceiverSocketId } from '../socket/index.js'

/**
 * @route   POST /api/v1/comments/:postId
 * @desc    Add a comment to a post
 * @access  Private
 */
export const addComment = async (req, res, next) => {
  try {
    const { text, parentComment } = req.body
    const { postId } = req.params

    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    let parent = null;
    // If replying to a comment, verify parent exists
    if (parentComment) {
      parent = await Comment.findById(parentComment)
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        })
      }
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text,
      parentComment: parentComment || null,
    })

    // Add comment reference to post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    })

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profilePicture')

    // Create Notification
    const recipientId = parent ? parent.author : post.author;
    if (recipientId.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'comment',
        reference: comment._id,
        onModel: 'Comment',
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username fullName profilePicture');

      const receiverSocketId = getReceiverSocketId(recipientId);
      if (receiverSocketId) {
        getIO().to(receiverSocketId).emit('new_notification', populatedNotification);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/comments/:postId
 * @desc    Get all comments for a post
 * @access  Private
 */
export const getPostComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null, // top-level comments only
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: null,
    })

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/comments/:postId/replies/:commentId
 * @desc    Get replies for a specific comment
 * @access  Private
 */
export const getCommentReplies = async (req, res, next) => {
  try {
    const replies = await Comment.find({
      post: req.params.postId,
      parentComment: req.params.commentId,
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullName profilePicture')

    res.status(200).json({
      success: true,
      data: replies,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PUT /api/v1/comments/:commentId
 * @desc    Update a comment (only by author)
 * @access  Private
 */
export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this comment',
      })
    }

    comment.text = req.body.text || comment.text
    await comment.save()

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profilePicture')

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   DELETE /api/v1/comments/:commentId
 * @desc    Delete a comment (only by author)
 * @access  Private
 */
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment',
      })
    }

    // Remove comment reference from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    })

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: comment._id })

    // Delete the comment
    await Comment.findByIdAndDelete(comment._id)

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
