import Notification from '../models/notification.model.js'

export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('sender', 'username fullName profilePicture')

    const total = await Notification.countDocuments({ recipient: req.user._id })
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false })

    res.status(200).json({
      success: true, data: notifications, unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) { next(error) }
}

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' })
    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' })
    notification.isRead = true
    await notification.save()
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification })
  } catch (error) { next(error) }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true })
    res.status(200).json({ success: true, message: 'All notifications marked as read' })
  } catch (error) { next(error) }
}

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
