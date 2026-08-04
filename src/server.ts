import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config/unifiedConfig';
import { socketAuthMiddleware, AuthenticatedSocket } from './sockets/socketAuth';
import { registerRoomSockets } from './sockets/roomSocket';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Socket.io middleware for authentication
io.use((socket, next) => socketAuthMiddleware(socket as AuthenticatedSocket, next));

// Socket.io connection handling
io.on('connection', (socket) => {
  registerRoomSockets(io, socket as AuthenticatedSocket);
});

// Database connection & Server initialization
async function startServer() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
