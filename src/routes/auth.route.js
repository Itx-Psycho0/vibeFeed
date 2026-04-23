import express from 'express'
import { register, login, getMe } from '../controllers/auth.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)

// Protected routes
router.get('/me', auth, getMe)

export default router