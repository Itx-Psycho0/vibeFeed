// ============================================================================
// 📁 FILE: comment.routes.js — Comment Routes
// 📚 TOPIC: Nested Resource Routes (comments belong to posts)
// ============================================================================

import express from 'express'
import {
  addComment, getPostComments, getCommentReplies,
  updateComment, deleteComment,
} from '../controllers/comment.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// All comment routes require authentication
router.use(auth)

// :postId is a URL parameter — identifies WHICH post the comment belongs to
router.post('/:postId', addComment)          // Add comment to a post
router.get('/:postId', getPostComments)       // Get top-level comments for a post
router.get('/:postId/replies/:commentId', getCommentReplies)  // Get replies to a comment
router.put('/:commentId', updateComment)      // Update a comment
router.delete('/:commentId', deleteComment)   // Delete a comment

export default router
