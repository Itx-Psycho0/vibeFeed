import express from 'express'
import {
  registerUser, getUserProfile, updateProfile,
  toggleFollow, getFollowers, getFollowing,
  searchUsers, getSuggestedUsers,
} from '../controllers/user.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// Public
router.post('/register', registerUser)

// Protected — put static routes BEFORE :id param routes
router.get('/search', auth, searchUsers)
router.get('/suggested', auth, getSuggestedUsers)
router.put('/profile', auth, updateProfile)

// Param-based routes
router.get('/:id', auth, getUserProfile)
router.post('/:id/follow', auth, toggleFollow)
router.get('/:id/followers', auth, getFollowers)
router.get('/:id/following', auth, getFollowing)

export default router
