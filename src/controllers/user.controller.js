import User from '../models/user.model.js'
import Notification from '../models/notification.model.js'
import { getIO, getReceiverSocketId } from '../socket/index.js'

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user (legacy — prefer /api/v1/auth/register)
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password, and fullName',
      })
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email or username already exists' })
    }

    const user = await User.create({ username, email, password, fullName })
    const createdUser = await User.findById(user._id)

    res.status(201).json({ success: true, message: 'User registered successfully', data: createdUser })
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture')

    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount: user.posts.length,
      },
    })
  } catch (error) { next(error) }
}

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, profilePicture, isPrivate } = req.body

    const user = await User.findById(req.user._id)
    if (fullName !== undefined) user.fullName = fullName
    if (bio !== undefined) user.bio = bio
    if (profilePicture !== undefined) user.profilePicture = profilePicture
    if (isPrivate !== undefined) user.isPrivate = isPrivate

    await user.save()

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user })
  } catch (error) { next(error) }
}

/**
 * @route   POST /api/v1/users/:id/follow
 * @desc    Follow / Unfollow a user (toggle)
 * @access  Private
 */
export const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id
    const currentUserId = req.user._id

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    const isFollowing = req.user.following.includes(targetUserId)

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } })
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } })
      return res.status(200).json({ success: true, message: 'User unfollowed', data: { following: false } })
    }

    // Follow
    await User.findByIdAndUpdate(currentUserId, { $push: { following: targetUserId } })
    await User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUserId } })

    // Create Notification
    const notification = await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      reference: currentUserId,
      onModel: 'User',
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username fullName profilePicture');

    const receiverSocketId = getReceiverSocketId(targetUserId);
    if (receiverSocketId) {
      getIO().to(receiverSocketId).emit('new_notification', populatedNotification);
    }

    res.status(200).json({ success: true, message: 'User followed', data: { following: true } })
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/:id/followers
 * @desc    Get followers of a user
 * @access  Private
 */
export const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username fullName profilePicture bio')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.status(200).json({ success: true, data: user.followers, total: user.followers.length })
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/:id/following
 * @desc    Get users that a user is following
 * @access  Private
 */
export const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username fullName profilePicture bio')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.status(200).json({ success: true, data: user.following, total: user.following.length })
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/search?q=keyword
 * @desc    Search users by username or fullName
 * @access  Private
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ success: false, message: 'Search query is required' })

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(20)
      .select('username fullName profilePicture bio')

    res.status(200).json({ success: true, data: users, total: users.length })
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/suggested
 * @desc    Get suggested users (users the current user is not following)
 * @access  Private
 */
export const getSuggestedUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id, $nin: req.user.following },
    })
      .limit(10)
      .select('username fullName profilePicture bio')

    res.status(200).json({ success: true, data: users })
  } catch (error) { next(error) }
}

/**
 * @route   POST /api/v1/users/:id/bookmark
 * @desc    Bookmark / Unbookmark a post
 * @access  Private
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isBookmarked = user.bookmarks.includes(postId);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks.pull(postId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Post removed from bookmarks', data: { bookmarked: false } });
    }

    // Add bookmark
    user.bookmarks.push(postId);
    await user.save();
    return res.status(200).json({ success: true, message: 'Post bookmarked', data: { bookmarked: true } });
  } catch (error) { next(error) }
}

/**
 * @route   GET /api/v1/users/bookmarks
 * @desc    Get bookmarked posts
 * @access  Private
 */
export const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'author', select: 'username fullName profilePicture' }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, data: user.bookmarks });
  } catch (error) { next(error) }
}
