// ============================================================================
// 📁 FILE: socket/index.js — Socket.io Real-Time Communication Setup
// 📍 LOCATION: backend/src/socket/index.js
// 📚 TOPIC: WebSockets, Socket.io, Real-Time Bidirectional Communication
// ============================================================================
//
// 🎯 PURPOSE:
// Sets up Socket.io for REAL-TIME features — instant notifications, live messaging,
// and online status tracking. Unlike HTTP (request-response), WebSockets keep a
// persistent connection open for instant two-way communication.
//
// 🧠 HTTP vs WebSocket:
//   HTTP:      Client asks → Server responds (one-time, connection closes)
//   WebSocket: Client connects → Connection stays OPEN → Either side can send anytime
//
// 🧠 HOW SOCKET.IO WORKS HERE:
// 1. Frontend connects with: io('http://localhost:8000', { auth: { token } })
// 2. Socket middleware verifies the JWT token (same as HTTP auth)
// 3. On successful connect, user is added to connectedUsers map
// 4. When something happens (new message, new like), we find the receiver's socket
//    and emit an event to them instantly
//
// 🔀 ALTERNATIVES: Server-Sent Events (SSE, one-way), WebRTC (peer-to-peer),
//                  Firebase Realtime DB, Supabase Realtime, Pusher, Ably
//
// 🔮 FUTURE: Typing indicators, video/voice calls, chat rooms, socket.io-redis
//           for multi-server support, reconnection handling
// ============================================================================

import { Server } from 'socket.io';  // Socket.io server class
import jwt from 'jsonwebtoken';       // For authenticating socket connections
import User from '../models/user.model.js';

// Module-level variables (shared across the module, like singletons)
let io;  // The Socket.io server instance

// Map to track which user is connected on which socket
// Key: userId (string), Value: socketId (string)
// This lets us find a user's socket to send them real-time data
// Map to store connected users and their socket IDs
const connectedUsers = new Map();

// ─── Initialize Socket.io ───────────────────────────────────────────────────
// Called from server.js after the HTTP server starts
// Takes the HTTP server and "upgrades" it to support WebSocket connections
export const initSocket = (server) => {
  // Create Socket.io server attached to the HTTP server
  // The same port handles both HTTP and WebSocket connections
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // ─── Socket Authentication Middleware ────────────────────────────────────
  // io.use() registers middleware that runs for EVERY socket connection attempt
  // This is like Express auth middleware but for WebSocket connections
  // The token is sent via socket.handshake.auth (set by the client)
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      // Client sends token via: io({ auth: { token: 'my-jwt-token' } })
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify JWT token (same as HTTP auth middleware)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket object (available in all socket event handlers)
      socket.user = user;
      next();  // Allow connection
    } catch (error) {
      next(new Error('Authentication error'));  // Reject connection
    }
  });

  // ─── Handle Socket Connections ────────────────────────────────────────────
  // 'connection' event fires when a client successfully connects
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Add user to the connected users map
    // This lets us find their socket ID later when we need to send them data
    // Add user to connected users map
    connectedUsers.set(socket.user._id.toString(), socket.id);
    
    // Tell everyone else this user is now online
    // socket.broadcast.emit sends to ALL connected sockets EXCEPT the sender
    // Broadcast when user comes online
    socket.broadcast.emit('user_online', { userId: socket.user._id });
    
    // Handle disconnect (user closes tab, loses internet, etc.)
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      connectedUsers.delete(socket.user._id.toString());
      // Tell everyone this user went offline
      socket.broadcast.emit('user_offline', { userId: socket.user._id });
    });

    // 🔮 FUTURE EVENT HANDLERS:
    // socket.on('typing', (data) => { ... })         // Typing indicator
    // socket.on('stop_typing', (data) => { ... })     // Stop typing
    // socket.on('join_room', (roomId) => { ... })     // Join a chat room
    // socket.on('leave_room', (roomId) => { ... })    // Leave a chat room
    // socket.on('mark_read', (msgId) => { ... })      // Read receipt
  });

  return io;
};

// ─── Get Socket.io Instance ─────────────────────────────────────────────────
// Used by controllers to emit events (e.g., new_notification, new_message)
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

// ─── Get Receiver's Socket ID ───────────────────────────────────────────────
// Given a userId, returns their socket ID (if they're online)
// Returns undefined if the user is offline
// Used by controllers: getReceiverSocketId(postAuthorId)
export const getReceiverSocketId = (userId) => {
  return connectedUsers.get(userId.toString());
};
