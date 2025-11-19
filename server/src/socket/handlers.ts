import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupSocketIO(httpServer: HTTPServer, corsOrigin: string) {
  // Validate and set up allowed origins
  const allowedOrigins = [
    corsOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.19:3000',
  ].filter((origin) => origin && (origin.startsWith('http://') || origin.startsWith('https://')));
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true, // Allow all if no valid origins
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join admin room (no authentication required - public access)
    socket.on('join:admin', () => {
      socket.join('admins');
      console.log('Client joined admin room:', socket.id);
    });

    // Auto-join admin room on connection
    socket.join('admins');

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

