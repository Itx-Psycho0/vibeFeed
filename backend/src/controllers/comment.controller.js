// ============================================================================
// 📁 FILE: comment.controller.js (Comment Controller)
// 📍 LOCATION: backend/src/controllers/comment.controller.js
// 📚 TOPIC: Comments, Nested Replies, Real-Time Notifications via Socket.io
// 🏗️ BUILD ORDER: Step 6c — After post controller
// ============================================================================
//
// 🎯 PURPOSE: Handles comment CRUD + nested replies + real-time notification to post author
// When someone comments, the post/parent comment author gets a real-time notification.
//
// 🔮 FUTURE: Comment mentions (@user), rich text, pinned comments, spam detection
// ============================================================================

import Comment from '../models/comment.model.js'
import Post from '../models/post.model.js'
import Notification from '../models/notification.model.js'
// Socket.io functions for real-time notifications
import { getIO, getReceiverSocketId } from '../socket/index.js'

// ─── ADD COMMENT ────────────────────────────────────────────────────────────
/**
 * @route   POST /api/v1/comments/:postId
 * @desc    Add a comment to a post
 * @access  Private
 */
export const addComment = async (req, res, next) => {
  try {
    const { text, parentComment } = req.body  // text = comment content, parentComment = reply-to ID
    const { postId } = req.params             // Which post to comment on (from URL)

    // Verify the post exists
    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // If this is a REPLY, verify the parent comment exists
    let parent = null;
    // If replying to a comment, verify parent exists
    if (parentComment) {
      parent = await Comment.findById(parentComment)
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' })
      }
    }

    // Create the comment document in MongoDB
    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text,
      parentComment: parentComment || null,  // null for top-level, ID for reply
    })

    // Add comment reference to the post's comments array
    // This maintains the two-way relationship (Post ↔ Comment)
    // Add comment reference to post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    })

    // Populate author details for the response
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profilePicture')

    // ─── Real-Time Notification via Socket.io ─────────────────────────────
    // Determine who to notify:
    //   - If replying to a comment → notify the parent comment's author
    //   - If top-level comment → notify the post's author
    // Don't notify yourself (no notification if you comment on your own post)
    // Create Notification
    const recipientId = parent ? parent.author : post.author;
    if (recipientId.toString() !== req.user._id.toString()) {
      // Create notification in database
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'comment',
        reference: comment._id,
        onModel: 'Comment',
      });

      // Populate sender details for the real-time event
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username fullName profilePicture');

      // Send real-time notification if the recipient is online
      // getReceiverSocketId() checks if the recipient has an active WebSocket connection
      const receiverSocketId = getReceiverSocketId(recipientId);
      if (receiverSocketId) {
        // .to(socketId) targets a specific user, .emit() sends the event
        getIO().to(receiverSocketId).emit('new_notification', populatedNotification);
      }
    }

    res.status(201).json({ success: true, message: 'Comment added successfully', data: populatedComment })
  } catch (error) {
    next(error)
  }
}

// ─── GET POST COMMENTS (with pagination, top-level only) ────────────────────
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

    // parentComment: null → Only top-level comments (not replies)
    // Replies are fetched separately via getCommentReplies()
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null, // top-level comments only
    })
      .sort({ createdAt: -1 })  // Newest comments first
      .skip(skip).limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Comment.countDocuments({ post: req.params.postId, parentComment: null })

    res.status(200).json({
      success: true, data: comments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
}

// ─── GET COMMENT REPLIES (nested replies for a specific comment) ────────────
/**
 * @route   GET /api/v1/comments/:postId/replies/:commentId
 * @desc    Get replies for a specific comment
 * @access  Private
 */
export const getCommentReplies = async (req, res, next) => {
  try {
    // Find comments whose parentComment matches the given commentId
    const replies = await Comment.find({
      post: req.params.postId,
      parentComment: req.params.commentId,  // Only replies to this comment
    })
      .sort({ createdAt: 1 })  // Oldest first (chronological) for replies
      .populate('author', 'username fullName profilePicture')

    res.status(200).json({ success: true, data: replies })
  } catch (error) {
    next(error)
  }
}

// ─── UPDATE COMMENT (author only) ───────────────────────────────────────────
/**
 * @route   PUT /api/v1/comments/:commentId
 * @desc    Update a comment (only by author)
 * @access  Private
 */
export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' })
    }

    // Authorization: only the comment author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this comment' })
    }

    comment.text = req.body.text || comment.text  // Update text if provided
    await comment.save()

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profilePicture')

    res.status(200).json({ success: true, message: 'Comment updated successfully', data: updatedComment })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE COMMENT (author only, cascade deletes replies) ──────────────────
/**
 * @route   DELETE /api/v1/comments/:commentId
 * @desc    Delete a comment (only by author)
 * @access  Private
 */
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' })
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' })
    }

    // Remove from post's comments array
    // Remove comment reference from post
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } })

    // CASCADE DELETE: Delete all replies to this comment
    // Without this, replies would become orphaned (parentComment pointing to deleted comment)
    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: comment._id })

    // Delete the comment itself
    // Delete the comment
    await Comment.findByIdAndDelete(comment._id)

    res.status(200).json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    next(error)
  }
}
