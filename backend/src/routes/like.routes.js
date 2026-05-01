// ============================================================================
// 📁 FILE: like.routes.js — Like Routes
// 📚 TOPIC: Toggle Endpoints (same URL, opposite action each call)
// ============================================================================

import express from 'express'
import { togglePostLike, toggleCommentLike, getPostLikes } from '../controllers/like.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()
router.use(auth)

// POST (not GET) because liking CHANGES data (it's an action, not a query)
router.post('/post/:postId', togglePostLike)       // Like/unlike a post
router.post('/comment/:commentId', toggleCommentLike) // Like/unlike a comment
router.get('/post/:postId', getPostLikes)          // Get list of users who liked a post

export default router
