const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/services/socketService');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/expenses', require('./src/routes/expenses'));
app.use('/api/budget', require('./src/routes/budget'));
app.use('/api/invitations', require('./src/routes/invitations'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/users', require('./src/routes/users'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Spenda API is running', timestamp: new Date() });
});

// Error middleware
app.use(require('./src/middlewares/errorMiddleware'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Spenda backend running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
