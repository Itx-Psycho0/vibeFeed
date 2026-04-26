import express from 'express'
import {
  registerUser, getUserProfile, updateProfile,
  toggleFollow, getFollowers, getFollowing,
  searchUsers, getSuggestedUsers,
  toggleBookmark, getBookmarks
} from '../controllers/user.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// Public
router.post('/register', registerUser)

// Protected — put static routes BEFORE :id param routes
router.get('/search', auth, searchUsers)
router.get('/suggested', auth, getSuggestedUsers)
router.put('/profile', auth, updateProfile)
router.get('/bookmarks', auth, getBookmarks)

// Param-based routes
router.get('/:id', auth, getUserProfile)
router.post('/:id/follow', auth, toggleFollow)
router.get('/:id/followers', auth, getFollowers)
router.get('/:id/following', auth, getFollowing)
router.post('/:id/bookmark', auth, toggleBookmark)

export default router
