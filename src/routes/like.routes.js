import express from 'express'
import { togglePostLike, toggleCommentLike, getPostLikes } from '../controllers/like.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.post('/post/:postId', togglePostLike)
router.post('/comment/:commentId', toggleCommentLike)
router.get('/post/:postId', getPostLikes)

export default router
