// ============================================================================
// 📁 FILE: auth.route.js — Authentication Routes
// 📚 TOPIC: Express Router, Public vs Protected Routes
// 🏗️ BUILD ORDER: Step 7 — Build routes AFTER controllers
// ============================================================================
// 🎯 PURPOSE: Defines URL endpoints for authentication.
// Routes are like a TABLE OF CONTENTS — they map URLs to controller functions.
//
// 🧠 ROUTE TYPES:
//   Public routes: No auth middleware → anyone can access (register, login)
//   Protected routes: auth middleware → only logged-in users (getMe)
//
// 🧠 EXPRESS ROUTER:
// express.Router() creates a mini-app that handles routes for a specific resource.
// It's like a sub-application that gets mounted at a specific path in app.js.
// ============================================================================

import express from 'express'
import { register, login, getMe } from '../controllers/auth.controller.js'
import auth from '../middlewares/auth.middleware.js'  // JWT verification middleware

// Create a router instance (a mini-app for auth routes)
const router = express.Router()

// Public routes — no authentication needed (anyone can register/login)
// Public routes
router.post('/register', register)   // POST /api/v1/auth/register → register controller
router.post('/login', login)         // POST /api/v1/auth/login → login controller

// Protected routes — auth middleware verifies JWT before reaching the controller
// The auth middleware runs FIRST, then getMe controller runs IF auth passes
// Protected routes
router.get('/me', auth, getMe)       // GET /api/v1/auth/me → getMe controller

export default router