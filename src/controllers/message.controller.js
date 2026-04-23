import Conversation from '../models/conversation.model.js'
import Message from '../models/message.model.js'

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username fullName profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
    res.status(200).json({ success: true, data: conversations })
  } catch (error) { next(error) }
}

export const createConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body
    if (!participantId) return res.status(400).json({ success: false, message: 'participantId is required' })

    // Check if conversation already exists between these two users
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, participantId], $size: 2 },
    }).populate('participants', 'username fullName profilePicture')

    if (existing) return res.status(200).json({ success: true, data: existing })

    const conversation = await Conversation.create({ participants: [req.user._id, participantId] })
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName profilePicture')
    res.status(201).json({ success: true, message: 'Conversation created', data: populated })
  } catch (error) { next(error) }
}

export const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 30
    const skip = (page - 1) * limit

    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('sender', 'username fullName profilePicture')

    const total = await Message.countDocuments({ conversation: req.params.conversationId })

    res.status(200).json({
      success: true, data: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) { next(error) }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { text, media } = req.body
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' })

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id))
      return res.status(403).json({ success: false, message: 'Not a participant in this conversation' })

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text, media,
      readBy: [req.user._id],
    })

    // Update last message on conversation
    conversation.lastMessage = message._id
    await conversation.save()

    const populated = await Message.findById(message._id).populate('sender', 'username fullName profilePicture')
    res.status(201).json({ success: true, data: populated })
  } catch (error) { next(error) }
}
