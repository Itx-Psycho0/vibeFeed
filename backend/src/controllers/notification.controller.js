// ============================================================================
// 📁 FILE: notification.controller.js — Notification Management
// 📚 TOPIC: Notification CRUD, Unread Count, Batch Operations
// ============================================================================
// 🎯 PURPOSE: Handles fetching, marking as read, and deleting notifications.
// Notifications are CREATED by other controllers (like, comment, follow).
// This controller handles READING and MANAGING them.
// ============================================================================

import Notification from '../models/notification.model.js'

// ─── GET NOTIFICATIONS (with unread count) ──────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Get notifications for the current user, newest first
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('sender', 'username fullName profilePicture')

    const total = await Notification.countDocuments({ recipient: req.user._id })
    // Count unread notifications (for the badge/bell icon number)
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false })

    res.status(200).json({
      success: true, data: notifications, unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) { next(error) }
}

// ─── MARK SINGLE NOTIFICATION AS READ ───────────────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' })
    // Authorization: only the recipient can mark their notifications
    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' })
    notification.isRead = true
    await notification.save()
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification })
  } catch (error) { next(error) }
}

// ─── MARK ALL NOTIFICATIONS AS READ (batch operation) ───────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    // updateMany updates ALL matching documents in one operation
    // Much more efficient than looping and updating one by one
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true })
    res.status(200).json({ success: true, message: 'All notifications marked as read' })
  } catch (error) { next(error) }
}

// ─── DELETE NOTIFICATION ────────────────────────────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' })
    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' })
    await Notification.findByIdAndDelete(notification._id)
    res.status(200).json({ success: true, message: 'Notification deleted' })
  } catch (error) { next(error) }
}
