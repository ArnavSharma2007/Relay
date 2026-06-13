import { Server, Socket } from 'socket.io';
import { addChatMessage } from '../../services/sessionService.js';
import type { User } from '../../../../shared/types.js';

interface SocketData {
  user: Omit<User, 'password'>;
  sessionId?: string;
}

export function registerChatHandlers(io: Server, socket: Socket) {
  const data = socket.data as SocketData;

  socket.on('chat:message', async (payload: { sessionId: string; content: string; type?: string }) => {
    const { sessionId, content, type = 'text' } = payload;

    const message = await addChatMessage({
      sessionId,
      userId: data.user.id,
      userName: data.user.name,
      role: data.user.role,
      content,
      type: type as 'text' | 'file' | 'system',
    });

    io.to(sessionId).emit('chat:message', { message });

    setTimeout(() => {
      io.to(sessionId).emit('chat:message', { message: { ...message, status: 'delivered' } });
    }, 500);

    setTimeout(() => {
      io.to(sessionId).emit('chat:message', { message: { ...message, status: 'seen' } });
    }, 2000);
  });

  socket.on('chat:typing', (payload: { sessionId: string; isTyping: boolean }) => {
    socket.to(payload.sessionId).emit('chat:typing', {
      userId: data.user.id,
      userName: data.user.name,
      isTyping: payload.isTyping,
    });
  });
}
