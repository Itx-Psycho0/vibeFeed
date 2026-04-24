import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

let io;

// Map to store connected users and their socket IDs
const connectedUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user._id.toString(), socket.id);
    
    // Broadcast when user comes online
    socket.broadcast.emit('user_online', { userId: socket.user._id });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      connectedUsers.delete(socket.user._id.toString());
      socket.broadcast.emit('user_offline', { userId: socket.user._id });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

export const getReceiverSocketId = (userId) => {
  return connectedUsers.get(userId.toString());
};
