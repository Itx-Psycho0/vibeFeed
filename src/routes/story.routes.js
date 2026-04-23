import express from 'express'
import {
  createStory, getStoryFeed, getStoryById,
  deleteStory, getStoryViewers,
} from '../controllers/story.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.post('/', createStory)
router.get('/feed', getStoryFeed)
router.get('/:id', getStoryById)
router.delete('/:id', deleteStory)
router.get('/:id/viewers', getStoryViewers)

export default router
