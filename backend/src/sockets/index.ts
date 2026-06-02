import { Server, Socket } from 'socket.io';

export const setupSockets = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join:queue-monitor', () => {
      socket.join('queue-monitor');
      console.log(`📺 Client ${socket.id} joined queue monitor`);
    });

    socket.on('join:cashier', () => {
      socket.join('cashier');
      console.log(`💰 Client ${socket.id} joined cashier`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
