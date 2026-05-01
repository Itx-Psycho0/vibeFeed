// ============================================================================
// 📁 FILE: story.routes.js — Story Routes (24-hour temporary content)
// ============================================================================

import express from 'express'
import {
  createStory, getStoryFeed, getStoryById,
  deleteStory, getStoryViewers,
} from '../controllers/story.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()
router.use(auth)

router.post('/', createStory)            // Create a new story
router.get('/feed', getStoryFeed)        // Get story feed (grouped by author)
router.get('/:id', getStoryById)         // View a story (tracks viewer)
router.delete('/:id', deleteStory)       // Delete a story (author only)
router.get('/:id/viewers', getStoryViewers) // Get who viewed your story

export default router
