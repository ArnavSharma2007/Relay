import { Server } from 'socket.io';
import { registerSessionHandlers, socketAuthMiddleware, emitAdminMetrics } from './handlers/sessionHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { registerRtcHandlers, registerAdminHandlers } from './handlers/rtcHandler.js';

export function setupSocketIO(io: Server) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerSessionHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerRtcHandlers(io, socket);
    registerAdminHandlers(io, socket);
  });

  setInterval(() => emitAdminMetrics(io), 3000);
}
