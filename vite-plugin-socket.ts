import type { Plugin } from 'vite';
import { Server } from 'socket.io';

export function websocketPlugin(): Plugin {
  return {
    name: 'websocket-plugin',
    configureServer(server) {
      if (!server.httpServer) return;

      const io = new Server(server.httpServer, {
        cors: {
          origin: '*',
        },
      });

      io.on('connection', (socket) => {
        // console.log('[Socket] Client connected:', socket.id);

        socket.on('wearable_bus_event', (data) => {
          // Broadcast to all other clients except the sender
          socket.broadcast.emit('wearable_bus_event', data);
        });

        socket.on('disconnect', () => {
          // console.log('[Socket] Client disconnected:', socket.id);
        });
      });
    },
  };
}
