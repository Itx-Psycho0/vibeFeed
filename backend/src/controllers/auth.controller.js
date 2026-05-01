// ============================================================================
// 📁 FILE: auth.controller.js (Authentication Controller)
// 📍 LOCATION: backend/src/controllers/auth.controller.js
// 📚 TOPIC: User Registration, Login, JWT Token Generation, Authentication Flow
// 🏗️ BUILD ORDER: Step 6a — Build controllers AFTER models + middleware
// ============================================================================
//
// 🎯 PURPOSE:
// Handles user authentication — Register, Login, and Get Current User.
// Controllers contain the BUSINESS LOGIC — what actually happens when an API is called.
//
// 🧠 MVC PATTERN (Model-View-Controller):
// This project follows the MVC architecture:
//   Model: Defines data structure (user.model.js)
//   View: What the user sees (React frontend)
//   Controller: Business logic connecting Model and View (THIS FILE)
//
// Request flow: Route → Middleware → Controller → Model → Database → Response
//
// 🔮 FUTURE: Add email verification, password reset, OAuth (Google/GitHub login),
//           2FA, account lockout after failed attempts, remember me functionality
// ============================================================================

// jwt (jsonwebtoken) creates and verifies JWT tokens for authentication
import jwt from 'jsonwebtoken'

// Import the User model to interact with the users collection in MongoDB
import User from '../models/user.model.js'

// ─── Helper: Generate JWT Token ─────────────────────────────────────────────
// Creates a signed JWT token containing the user's ID
// This token is sent to the frontend and used for all subsequent authenticated requests
//
// Parameters:
//   id — The user's MongoDB _id (unique identifier)
//
// jwt.sign(payload, secret, options):
//   payload: { id } — Data stored inside the token (keep it minimal!)
//   secret: JWT_SECRET — A long random string used to sign/verify tokens
//   options: { expiresIn } — Token validity period (7 days by default)
//
// TOPIC: JWT Token Generation — Creating secure authentication tokens
/**
 * Generate a JWT token for a given user ID
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ============================================================================
// CONTROLLER 1: REGISTER (Create a new user account)
// ============================================================================
// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public (anyone can register, no token needed)
//
// REQUEST BODY (what the frontend sends):
//   { username: "psycho", email: "psycho@test.com", password: "123456", fullName: "Anurag" }
//
// RESPONSE (what we send back):
//   { success: true, data: { user: {...}, token: "eyJ..." } }
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res, next) => {
  // (req, res, next) is the Express handler signature:
  //   req: The incoming request (contains body, headers, params, etc.)
  //   res: The response object (used to send data back to the client)
  //   next: Function to pass control to the next middleware (used for error handling)
  try {
    // ─── Step 1: Extract data from request body ─────────────────────────
    // Destructuring extracts named properties from req.body
    // req.body is available because of express.json() middleware in app.js
    const { username, email, password, fullName } = req.body

    // ─── Step 2: Validate required fields ───────────────────────────────
    // Check that all required fields were provided
    // The ! operator converts the value to boolean and negates it
    // Empty string, null, undefined all become true with !
    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        // 400 = Bad Request (client sent invalid data)
        success: false,
        message: 'Please provide all required fields: username, email, password, and fullName',
      })
    }

    // ─── Step 3: Check for existing user ─────────────────────────────────
    // $or is a MongoDB operator that matches if ANY condition is true
    // We check both email AND username to prevent duplicates of either
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(409).json({
        // 409 = Conflict (the resource already exists)
        success: false,
        message: 'User with this email or username already exists',
      })
    }

    // ─── Step 4: Create the user ──────────────────────────────────────────
    // User.create() inserts a new document into the users collection
    // The pre-save hook in user.model.js automatically hashes the password
    // Create user (password hashing is handled by pre-save hook)
    const user = await User.create({ username, email, password, fullName })

    // ─── Step 5: Generate JWT token ─────────────────────────────────────
    // Create a token the frontend will use for authentication
    // Generate token
    const token = generateToken(user._id)

    // ─── Step 6: Fetch user WITHOUT password ─────────────────────────────
    // We re-fetch because User.create() returns the doc WITH password
    // User.findById() excludes password by default (select: false in schema)
    // Return user without password
    const userData = await User.findById(user._id)

    // ─── Step 7: Send success response ──────────────────────────────────
    res.status(201).json({
      // 201 = Created (a new resource was successfully created)
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,  // User object (without password)
        token,           // JWT token for authentication
        // Shorthand: { token } is the same as { token: token }
      },
    })
  } catch (error) {
    // Pass any unexpected error to the global error handler
    // next(error) skips remaining middleware and goes to errorHandler
    next(error)
  }
}

// ============================================================================
// CONTROLLER 2: LOGIN (Authenticate existing user)
// ============================================================================
// @route   POST /api/v1/auth/login
// @desc    Login user & return token
// @access  Public
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & return token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate input
    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      })
    }

    // ─── Find user WITH password ─────────────────────────────────────────
    // .select('+password') overrides the 'select: false' in the schema
    // We NEED the password here to compare it with the entered password
    // The '+' prefix means "include this field even though it's excluded by default"
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        // 401 = Unauthorized (invalid credentials)
        success: false,
        message: 'Invalid email or password',
        // ⚠️ SECURITY: We say "Invalid email or password" not "Email not found"
        // This prevents attackers from knowing which emails are registered
      })
    }

    // ─── Compare password using bcrypt ───────────────────────────────────
    // user.comparePassword() is the instance method we defined in user.model.js
    // It uses bcrypt to compare the plain text password with the stored hash
    // Compare password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Generate token for the authenticated user
    // Generate token
    const token = generateToken(user._id)

    // Fetch user without password for the response
    // Return user without password
    const userData = await User.findById(user._id)

    res.status(200).json({
      // 200 = OK (request successful)
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

// ============================================================================
// CONTROLLER 3: GET ME (Get current logged-in user's profile)
// ============================================================================
// @route   GET /api/v1/auth/me
// @desc    Get current logged-in user
// @access  Private (requires auth middleware — token must be valid)
//
// This endpoint is called by the frontend on page load to check if the user
// is still logged in (token still valid). Used by AuthContext.jsx.
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user was attached by the auth middleware (auth.middleware.js)
    // We re-fetch with populate to get follower/following details
    //
    // .populate() replaces ObjectId references with actual document data
    // 'followers' field contains User IDs → populate replaces them with user objects
    // Second argument ('username fullName profilePicture') selects only specific fields
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
