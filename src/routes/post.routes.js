import express from 'express'
import {
  createPost, getFeedPosts, getExplorePosts,
  getPostById, updatePost, deletePost, getUserPosts,
} from '../controllers/post.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

// All routes are protected
router.use(auth)

router.post('/', createPost)
router.get('/', getFeedPosts)
router.get('/explore', getExplorePosts)
router.get('/user/:userId', getUserPosts)
router.get('/:id', getPostById)
router.put('/:id', updatePost)
router.delete('/:id', deletePost)

export default router
