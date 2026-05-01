// ============================================================================
// 📁 FILE: auth.middleware.js (Authentication Middleware)
// 📍 LOCATION: backend/src/middlewares/auth.middleware.js
// 📚 TOPIC: JWT Authentication, Token Verification, Protected Routes
// 🏗️ BUILD ORDER: Step 5a — Build middleware AFTER models, BEFORE controllers
// ============================================================================
//
// 🎯 PURPOSE:
// This middleware PROTECTS routes — only logged-in users can access them.
// It reads the JWT token from the request header, verifies it, and attaches
// the user's data to req.user for downstream handlers.
//
// 🧠 HOW JWT AUTHENTICATION WORKS:
// 1. User logs in → server creates a JWT token and sends it to the frontend
// 2. Frontend stores the token (in localStorage)
// 3. For every API request, frontend sends: Authorization: "Bearer <token>"
// 4. This middleware reads the token, verifies it, and finds the user
// 5. If valid → request proceeds. If invalid → 401 Unauthorized response
//
// 🧠 WHAT IS A JWT (JSON Web Token)?
// A JWT is a string with 3 parts separated by dots: header.payload.signature
// Example: eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEyMyJ9.signature
//   Header: { "alg": "HS256" }       ← Algorithm used
//   Payload: { "id": "abc123" }       ← The data (user ID)
//   Signature: HMAC(header+payload, secret)  ← Proves the token is authentic
//
// The server can VERIFY the token without a database query!
// It just checks if the signature is valid using the JWT_SECRET.
//
// 🔀 ALTERNATIVE AUTH APPROACHES:
// - Session-based auth (store session in Redis/DB, use cookies)
// - OAuth 2.0 (Google/GitHub login via Passport.js)
// - API Keys (simpler, for server-to-server communication)
// - Firebase Auth (managed auth service, no backend code needed)
//
// 🔮 FUTURE: Add refresh tokens, role-based access control (admin/mod/user),
//           token blacklisting for logout, rate limiting per user
// ============================================================================

import jwt from 'jsonwebtoken'  // Library for creating and verifying JWT tokens
import User from '../models/user.model.js'  // User model to find user from decoded token

/**
 * Authentication Middleware
 * Verifies the JWT token from the Authorization header
 * and attaches the authenticated user to req.user
 */
const auth = async (req, res, next) => {
  try {
    // ─── Step 1: Extract token from Authorization header ─────────────────
    // The frontend sends: headers: { Authorization: "Bearer eyJhbGc..." }
    // We read the 'authorization' header (Express normalizes to lowercase)
    // Get token from header
    const authHeader = req.headers.authorization

    // Check if header exists and starts with 'Bearer '
    // 'Bearer' is a convention from the OAuth 2.0 spec — means "I'm bearing a token"
    // If no header or wrong format → reject with 401 (Unauthorized)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      })
    }

    // Extract the actual token (everything after "Bearer ")
    // "Bearer eyJhbGc...".split(' ') → ["Bearer", "eyJhbGc..."]
    // [1] gets the second element (the token)
    const token = authHeader.split(' ')[1]

    // ─── Step 2: Verify the token ─────────────────────────────────────────
    // jwt.verify() checks if:
    //   a) The token was signed with our JWT_SECRET (not tampered with)
    //   b) The token hasn't expired (checked against 'exp' claim)
    // If invalid → throws an error caught by the catch block
    // Returns the decoded payload: { id: "abc123", iat: 1234567890, exp: 1234567890 }
    //   id: User's MongoDB _id
    //   iat: "Issued At" timestamp
    //   exp: "Expires" timestamp
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ─── Step 3: Find the user in the database ────────────────────────────
    // Even though the token is valid, the user might have been deleted since login
    // We query MongoDB to make sure the user still exists
    // Password is excluded by default (select: false in schema)
    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      })
    }

    // ─── Step 4: Attach user to request object ────────────────────────────
    // req.user = user makes the full user document available to ALL subsequent handlers
    // Any controller after this middleware can access req.user._id, req.user.username, etc.
    // TOPIC: Request Augmentation — Adding data to the request for downstream use
    req.user = user

    // ─── Step 5: Pass control to the next middleware/route handler ─────────
    // next() tells Express "I'm done, move to the next function in the chain"
    // Without calling next(), the request would hang forever
    next()
  } catch (error) {
    // ─── Handle specific JWT errors ────────────────────────────────────────
    // JWT throws specific error types for different failure reasons

    if (error.name === 'JsonWebTokenError') {
      // Token is malformed, tampered with, or uses wrong algorithm
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      })
    }
    if (error.name === 'TokenExpiredError') {
      // Token was valid but has passed its expiration date (JWT_EXPIRES_IN)
      // 🔮 FUTURE: Implement refresh token flow — issue a new access token
      //           without requiring the user to log in again
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      })
    }

    // For any other unexpected error, pass it to the global error handler
    next(error)
  }
}

export default auth
