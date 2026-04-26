import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

/**
 * Generate a JWT token for a given user ID
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password, and fullName',
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      })
    }

    // Create user (password hashing is handled by pre-save hook)
    const user = await User.create({ username, email, password, fullName })

    // Generate token
    const token = generateToken(user._id)

    // Return user without password
    const userData = await User.findById(user._id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & return token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      })
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Compare password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user without password
    const userData = await User.findById(user._id)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture')

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}
