// ============================================================================
// 📁 FILE: story.controller.js — Stories (24-hour temporary content)
// 📚 TOPIC: Temporary Content, Story Feed Grouping, View Tracking
// ============================================================================
// 🎯 PURPOSE: Handles create, view, delete stories and grouping stories by author.
// Stories auto-delete after 24 hours via MongoDB TTL index (set in story.model.js).
// 🔮 FUTURE: Story reactions, story replies, story highlights, music overlay
// ============================================================================

import Story from '../models/story.model.js'

// ─── CREATE STORY ───────────────────────────────────────────────────────────
export const createStory = async (req, res, next) => {
  try {
    const { media, caption } = req.body
    if (!media || !media.url) {
      return res.status(400).json({ success: false, message: 'Story media URL is required' })
    }
    const story = await Story.create({ author: req.user._id, media, caption })
    const populated = await Story.findById(story._id).populate('author', 'username fullName profilePicture')
    res.status(201).json({ success: true, message: 'Story created successfully', data: populated })
  } catch (error) { next(error) }
}

// ─── GET STORY FEED (grouped by author) ─────────────────────────────────────
export const getStoryFeed = async (req, res, next) => {
  try {
    // Show stories from people you follow + your own, that haven't expired
    const feedUsers = [...req.user.following, req.user._id]
    const stories = await Story.find({ author: { $in: feedUsers }, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 }).populate('author', 'username fullName profilePicture')

    // Group stories by author (like Instagram — each user has a "ring" of stories)
    // Result: [{ author: {username: "alice"}, stories: [story1, story2] }, ...]
    const grouped = {}
    stories.forEach((s) => {
      const aid = s.author._id.toString()
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [] }
      grouped[aid].stories.push(s)
    })
    res.status(200).json({ success: true, data: Object.values(grouped) })
  } catch (error) { next(error) }
}

// ─── GET SINGLE STORY (and track view) ──────────────────────────────────────
export const getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('author', 'username fullName profilePicture')
    if (!story) return res.status(404).json({ success: false, message: 'Story not found or expired' })
    // Track viewer (add current user to viewers if not already there)
    if (!story.viewers.includes(req.user._id)) { story.viewers.push(req.user._id); await story.save() }
    res.status(200).json({ success: true, data: story })
  } catch (error) { next(error) }
}

// ─── DELETE STORY (author only) ─────────────────────────────────────────────
export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' })
    if (story.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' })
    await Story.findByIdAndDelete(story._id)
    res.status(200).json({ success: true, message: 'Story deleted successfully' })
  } catch (error) { next(error) }
}

// ─── GET STORY VIEWERS (author only) ────────────────────────────────────────
export const getStoryViewers = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('viewers', 'username fullName profilePicture')
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' })
    if (story.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only author can view viewers' })
    res.status(200).json({ success: true, data: story.viewers, total: story.viewers.length })
  } catch (error) { next(error) }
}
