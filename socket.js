import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('join-room', (role) => {
      if (role === 'cms') {
        socket.join('cms-admins');
        console.log(`Socket ${socket.id} joined room: cms-admins`);
      } else if (role === 'student') {
        socket.join('students');
        console.log(`Socket ${socket.id} joined room: students`);
      } else if (role === 'admin') {
        socket.join('admins');
        console.log(`Socket ${socket.id} joined room: admins`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
