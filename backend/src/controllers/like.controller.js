// ============================================================================
// 📁 FILE: like.controller.js — Like/Unlike Posts & Comments
// 📚 TOPIC: Toggle Pattern, Polymorphic Likes, Real-Time Notifications
// ============================================================================
// 🎯 PURPOSE: Handles like/unlike on posts and comments using a TOGGLE pattern.
// Toggle = if already liked → unlike, if not liked → like (one endpoint does both)
// Sends real-time notifications via Socket.io when someone likes your content.
// ============================================================================

import Like from '../models/like.model.js'
import Post from '../models/post.model.js'
import Comment from '../models/comment.model.js'
import Notification from '../models/notification.model.js'
import { getIO, getReceiverSocketId } from '../socket/index.js'

// ─── TOGGLE POST LIKE ──────────────────────────────────────────────────────
/**
 * @route   POST /api/v1/likes/post/:postId
 * @desc    Toggle like on a post (like if not liked, unlike if already liked)
 * @access  Private
 */
export const togglePostLike = async (req, res, next) => {
  try {
    const { postId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Check if the user already liked this post
    // Check if already liked
    const existingLike = await Like.findOne({
      user: req.user._id,
      likeable: postId,
      onModel: 'Post',  // Looking for a Post like (not Comment like)
    })

    if (existingLike) {
      // ─── UNLIKE: Remove the like ───────────────────────────────────────
      // Unlike
      await Like.findByIdAndDelete(existingLike._id)
      // Remove user from the post's likes array
      await Post.findByIdAndUpdate(postId, { $pull: { likes: req.user._id } })

      return res.status(200).json({
        success: true, message: 'Post unliked', data: { liked: false },
      })
    }

    // ─── LIKE: Create a new like ──────────────────────────────────────────
    // Like
    await Like.create({ user: req.user._id, likeable: postId, onModel: 'Post' })
    // Add user to the post's likes array
    await Post.findByIdAndUpdate(postId, { $push: { likes: req.user._id } })

    // Send real-time notification (don't notify yourself)
    // Create Notification
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author, sender: req.user._id,
        type: 'like', reference: post._id, onModel: 'Post'
      });
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username fullName profilePicture');
      const receiverSocketId = getReceiverSocketId(post.author);
      if (receiverSocketId) {
        getIO().to(receiverSocketId).emit('new_notification', populatedNotification);
      }
    }

    res.status(200).json({ success: true, message: 'Post liked', data: { liked: true } })
  } catch (error) {
    next(error)
  }
}

// ─── TOGGLE COMMENT LIKE (same pattern as post like) ────────────────────────
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
      return res.status(404).json({ success: false, message: 'Comment not found' })
    }

    const existingLike = await Like.findOne({
      user: req.user._id, likeable: commentId, onModel: 'Comment',
    })

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id)
      await Comment.findByIdAndUpdate(commentId, { $pull: { likes: req.user._id } })
      return res.status(200).json({ success: true, message: 'Comment unliked', data: { liked: false } })
    }

    await Like.create({ user: req.user._id, likeable: commentId, onModel: 'Comment' })
    await Comment.findByIdAndUpdate(commentId, { $push: { likes: req.user._id } })

    // Notify comment author
    // Create Notification
    if (comment.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: comment.author, sender: req.user._id,
        type: 'like', reference: comment._id, onModel: 'Comment'
      });
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username fullName profilePicture');
      const receiverSocketId = getReceiverSocketId(comment.author);
      if (receiverSocketId) {
        getIO().to(receiverSocketId).emit('new_notification', populatedNotification);
      }
    }

    res.status(200).json({ success: true, message: 'Comment liked', data: { liked: true } })
  } catch (error) {
    next(error)
  }
}

// ─── GET POST LIKES (list of users who liked a post) ────────────────────────
/**
 * @route   GET /api/v1/likes/post/:postId
 * @desc    Get all users who liked a post
 * @access  Private
 */
export const getPostLikes = async (req, res, next) => {
  try {
    // Find all Like documents for this post and populate user details
    const likes = await Like.find({
      likeable: req.params.postId, onModel: 'Post',
    }).populate('user', 'username fullName profilePicture')

    res.status(200).json({ success: true, data: likes, total: likes.length })
  } catch (error) {
    next(error)
  }
}
