import express from 'express'
import {
  addComment, getPostComments, getCommentReplies,
  updateComment, deleteComment,
} from '../controllers/comment.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.post('/:postId', addComment)
router.get('/:postId', getPostComments)
router.get('/:postId/replies/:commentId', getCommentReplies)
router.put('/:commentId', updateComment)
router.delete('/:commentId', deleteComment)

export default router
