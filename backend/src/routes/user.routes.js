// ============================================================================
// 📁 FILE: user.routes.js — User Routes (Profile, Follow, Search, Bookmarks)
// 📚 TOPIC: Route Organization, Static vs Dynamic Routes, Route Order
// ============================================================================
// ⚠️ CRITICAL: Static routes (/search, /suggested) must come BEFORE dynamic routes (/:id)
// Otherwise Express would treat "search" as an :id parameter!
// Example: GET /api/v1/users/search → Express might think "search" is a user ID
// ============================================================================

import express from 'express'
import {
  registerUser, getUserProfile, updateProfile,
  toggleFollow, getFollowers, getFollowing,
  searchUsers, getSuggestedUsers,
  toggleBookmark, getBookmarks
} from '../controllers/user.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// Public route (no auth needed)
// Public
router.post('/register', registerUser)

// Protected — put static routes BEFORE :id param routes
// ⚠️ ORDER MATTERS! These static paths must come BEFORE /:id routes
// If /:id came first, "search" would be treated as a user ID
// Protected — put static routes BEFORE :id param routes
router.get('/search', auth, searchUsers)       // GET /api/v1/users/search?q=john
router.get('/suggested', auth, getSuggestedUsers)  // GET /api/v1/users/suggested
router.put('/profile', auth, updateProfile)    // PUT /api/v1/users/profile
router.get('/bookmarks', auth, getBookmarks)   // GET /api/v1/users/bookmarks

// Param-based routes (dynamic — :id is a variable)
// Param-based routes
router.get('/:id', auth, getUserProfile)       // GET /api/v1/users/abc123
router.post('/:id/follow', auth, toggleFollow) // POST /api/v1/users/abc123/follow
router.get('/:id/followers', auth, getFollowers)
router.get('/:id/following', auth, getFollowing)
router.post('/:id/bookmark', auth, toggleBookmark)

export default router
