// ============================================================================
// 📁 FILE: api.js — Axios HTTP Client Configuration
// 📍 LOCATION: frontend/src/utils/api.js
// 📚 TOPIC: HTTP Client, Axios Interceptors, API Communication
// ============================================================================
//
// 🎯 PURPOSE:
// Creates a pre-configured Axios instance for making API calls to our backend.
// Automatically adds the JWT token to every request (via interceptors).
//
// 🧠 WHY AXIOS (instead of fetch)?
// - Automatic JSON parsing (fetch requires .json() call)
// - Request/response interceptors (automatically add auth token)
// - Better error handling (non-2xx responses throw errors automatically)
// - Request cancellation, timeout configuration
// - Works identically in Node.js and browser
//
// 🔀 ALTERNATIVES: Native fetch API, ky, got (Node.js only), superagent
//
// 🔮 FUTURE: Add response interceptor for auto-logout on 401, request retry logic,
//           error toast notifications, request caching with TanStack Query
// ============================================================================

// Axios is an HTTP client library — it makes API calls (GET, POST, PUT, DELETE)
import axios from 'axios';

// ─── Create Axios Instance ──────────────────────────────────────────────────
// axios.create() makes a NEW Axios instance with custom default settings
// Every request made with 'api' will use these settings automatically
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',  // All requests are prefixed with this URL
  // So api.get('/posts') actually calls http://localhost:8000/api/v1/posts
  // 🔮 FUTURE: Use environment variable: import.meta.env.VITE_API_URL
  withCredentials: true,  // Send cookies with cross-origin requests (needed for CORS)
});

// ─── Request Interceptor (Auto-Attach JWT Token) ────────────────────────────
// Interceptors run BEFORE every request is sent
// This automatically adds the Authorization header with the JWT token
// Without this, you'd need to manually add the token to every API call
//
// TOPIC: Axios Interceptors — Middleware for HTTP requests
// WHY: Instead of adding { headers: { Authorization: 'Bearer ...' } } to every call,
//      the interceptor does it AUTOMATICALLY
api.interceptors.request.use((config) => {
  // Get the token from localStorage (saved during login)
  const token = localStorage.getItem('token');
  if (token) {
    // Add the Authorization header with the Bearer token
    // The backend's auth middleware reads this header to verify the user
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Return the modified config (MUST return it or the request won't be sent)
  return config;
});

// Export the configured Axios instance
// Usage: import api from '../utils/api'
//        const res = await api.get('/posts')
//        const res = await api.post('/auth/login', { email, password })
export default api;
