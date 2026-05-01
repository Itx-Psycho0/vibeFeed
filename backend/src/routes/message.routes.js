// ============================================================================
// 📁 FILE: message.routes.js — Messaging Routes
// ============================================================================

import express from 'express'
import {
  getConversations, createConversation,
  getMessages, sendMessage,
} from '../controllers/message.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()
router.use(auth)

router.get('/conversations', getConversations)     // Get all conversations (inbox)
router.post('/conversations', createConversation)  // Start a new conversation
router.get('/:conversationId', getMessages)        // Get messages in a conversation
router.post('/:conversationId', sendMessage)       // Send a message

export default router
