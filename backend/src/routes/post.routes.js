// ============================================================================
// 📁 FILE: post.routes.js — Post Routes
// 📚 TOPIC: RESTful Route Design, router.use(auth) for Blanket Protection
// ============================================================================
// All post routes are protected — router.use(auth) applies auth to EVERY route below it
// This is cleaner than adding 'auth' to each individual route
// ============================================================================

import express from 'express'
import {
  createPost, getFeedPosts, getExplorePosts,
  getPostById, updatePost, deletePost, getUserPosts, searchPosts
} from '../controllers/post.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// All routes are protected — auth middleware applied globally to this router
// All routes are protected
router.use(auth)

// RESTful routes:
// POST /  → Create        (Create)
// GET /   → List/Feed      (Read many)
// GET /:id → Get one       (Read one)
// PUT /:id → Update        (Update)
// DELETE /:id → Remove     (Delete)
router.post('/', createPost)            // Create a new post
router.get('/', getFeedPosts)           // Get personalized feed
router.get('/explore', getExplorePosts) // Public explore page (with caching)
router.get('/search', searchPosts)      // Search posts by caption/hashtags
router.get('/user/:userId', getUserPosts) // Posts by a specific user
router.get('/:id', getPostById)         // Get single post by ID
router.put('/:id', updatePost)          // Update post (author only)
router.delete('/:id', deletePost)       // Delete post (author only)

export default router
