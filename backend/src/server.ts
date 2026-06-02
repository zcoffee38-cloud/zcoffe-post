import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import app from './app';
import { setupSockets } from './sockets';
import { setSocketIO } from './modules/transactions/transactions.routes';
import { setQueueSocketIO } from './modules/queues/queues.routes';
import prisma from './config/database';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5172',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Pass socket.io instance to modules
setSocketIO(io);
setQueueSocketIO(io);

// Setup socket handlers
setupSockets(io);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    httpServer.listen(PORT, () => {
      console.log('');
      console.log('☕ ================================');
      console.log('☕  Z Coffee POS - Backend Server');
      console.log('☕ ================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/v1`);
      console.log(`🔌 Socket.IO ready`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
