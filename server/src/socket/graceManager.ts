import { cleanupPeer } from '../mediasoup/transports.js';
import { Server } from 'socket.io';

const pendingDisconnects = new Map<string, NodeJS.Timeout>();

export function startGracePeriod(sessionId: string, peerId: string, io: Server) {
  const key = `${sessionId}:${peerId}`;
  if (pendingDisconnects.has(key)) {
    clearTimeout(pendingDisconnects.get(key));
  }

  const timeout = setTimeout(() => {
    console.log(`[Grace Period] Expired for ${peerId} in ${sessionId}. Cleaning up.`);
    cleanupPeer(sessionId, peerId);
    io.to(sessionId).emit('rtc:peer-left', { peerId });
    pendingDisconnects.delete(key);
  }, 10000); // 10s grace window

  pendingDisconnects.set(key, timeout);
}

export function cancelGracePeriod(sessionId: string, peerId: string): boolean {
  const key = `${sessionId}:${peerId}`;
  if (pendingDisconnects.has(key)) {
    console.log(`[Grace Period] Cancelled for ${peerId} in ${sessionId}.`);
    clearTimeout(pendingDisconnects.get(key));
    pendingDisconnects.delete(key);
    return true; // Reconnected within grace window
  }
  return false;
}

export function hasPendingGrace(sessionId: string, peerId: string): boolean {
  return pendingDisconnects.has(`${sessionId}:${peerId}`);
}
