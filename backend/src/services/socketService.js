const { Server } = require('socket.io');

let io;

// Map userId → socketId for targeted emits
const userSocketMap = {};

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // User registers their userId on connect
    socket.on('register', (userId) => {
      userSocketMap[userId] = socket.id;
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      // Remove from map
      const entry = Object.entries(userSocketMap).find(([, sid]) => sid === socket.id);
      if (entry) {
        delete userSocketMap[entry[0]];
        console.log(`[Socket] User ${entry[0]} disconnected`);
      }
    });
  });

  return io;
};

/**
 * Emit an event to a specific user by userId
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit expense update to a user's partner
 */
const emitExpenseUpdate = (partnerId, action, expense) => {
  emitToUser(String(partnerId), 'partner_expense_update', { action, expense });
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitExpenseUpdate, getIO };
