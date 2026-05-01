// ============================================================================
// 📁 FILE: notification.routes.js — Notification Routes
// ============================================================================

import express from 'express'
import {
  getNotifications, markAsRead,
  markAllAsRead, deleteNotification,
} from '../controllers/notification.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()
router.use(auth)

router.get('/', getNotifications)        // Get all notifications (paginated, with unread count)
router.put('/read-all', markAllAsRead)   // Mark ALL notifications as read (batch)
router.put('/:id/read', markAsRead)      // Mark ONE notification as read
router.delete('/:id', deleteNotification) // Delete a notification

export default router
