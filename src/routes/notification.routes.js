import express from 'express'
import {
  getNotifications, markAsRead,
  markAllAsRead, deleteNotification,
} from '../controllers/notification.controller.js'
import auth from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.get('/', getNotifications)
router.put('/read-all', markAllAsRead)
router.put('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

export default router
