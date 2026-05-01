// ============================================================================
// 📁 FILE: message.controller.js — Real-Time Messaging System
// 📚 TOPIC: Conversations, Messages, Pagination, Real-Time with Socket.io
// ============================================================================
// 🎯 PURPOSE: Handles the DM (direct messaging) system — create conversations,
// send messages, and deliver them in real-time via WebSockets.
// 🔮 FUTURE: Group chats, typing indicators, read receipts, message search
// ============================================================================

import Conversation from '../models/conversation.model.js'
import Message from '../models/message.model.js'
import { getIO, getReceiverSocketId } from '../socket/index.js'

// ─── GET ALL CONVERSATIONS (inbox) ──────────────────────────────────────────
export const getConversations = async (req, res, next) => {
  try {
    // Find all conversations where the current user is a participant
    // Sorted by most recently updated (most recent chat first)
    // Populate participants and lastMessage for inbox preview
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username fullName profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
    res.status(200).json({ success: true, data: conversations })
  } catch (error) { next(error) }
}

// ─── CREATE CONVERSATION (start a new chat) ─────────────────────────────────
export const createConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body
    if (!participantId) return res.status(400).json({ success: false, message: 'participantId is required' })

    // Check if conversation already exists between these two users
    // $all: both users must be in participants, $size: exactly 2 participants
    // This prevents creating duplicate DM conversations
    // Check if conversation already exists between these two users
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, participantId], $size: 2 },
    }).populate('participants', 'username fullName profilePicture')

    // If conversation exists, return it (don't create duplicate)
    if (existing) return res.status(200).json({ success: true, data: existing })

    // Create new conversation
    const conversation = await Conversation.create({ participants: [req.user._id, participantId] })
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName profilePicture')
    res.status(201).json({ success: true, message: 'Conversation created', data: populated })
  } catch (error) { next(error) }
}

// ─── GET MESSAGES (paginated, for a specific conversation) ──────────────────
export const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 30
    const skip = (page - 1) * limit

    // Sort by newest first for pagination, then reverse for display
    // WHY reverse? We want to load the LATEST messages but display them oldest-first
    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('sender', 'username fullName profilePicture')

    const total = await Message.countDocuments({ conversation: req.params.conversationId })

    res.status(200).json({
      success: true, data: messages.reverse(),  // Reverse for chronological display order
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) { next(error) }
}

// ─── SEND MESSAGE (with real-time delivery via Socket.io) ───────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { text, media } = req.body
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' })

    // Security: Verify the sender is actually a participant
    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id))
      return res.status(403).json({ success: false, message: 'Not a participant in this conversation' })

    // Create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text, media,
      readBy: [req.user._id],  // Sender has already "read" their own message
    })

    // Update conversation's lastMessage (for inbox preview)
    // Update last message on conversation
    conversation.lastMessage = message._id
    await conversation.save()

    const populated = await Message.findById(message._id).populate('sender', 'username fullName profilePicture')
    
    // ─── Real-Time Message Delivery ──────────────────────────────────────
    // Find the OTHER participant (not the sender) and send them the message instantly
    // .find() on the array returns the first matching element
    // Socket.io integration
    const receiverId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // Emit 'new_message' event to the receiver's socket
        getIO().to(receiverSocketId).emit('new_message', populated);
      }
    }

    res.status(201).json({ success: true, data: populated })
  } catch (error) { next(error) }
}
