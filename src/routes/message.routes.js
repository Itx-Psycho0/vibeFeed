import express from 'express'
import {
  getConversations, createConversation,
  getMessages, sendMessage,
} from '../controllers/message.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.get('/conversations', getConversations)
router.post('/conversations', createConversation)
router.get('/:conversationId', getMessages)
router.post('/:conversationId', sendMessage)

export default router
