import { Server, Socket } from 'socket.io';
import {
  createWebRtcTransport,
  connectTransport,
  createProducer,
  createConsumer,
  resumeConsumer,
  getProducersForSession,
  getRouterRtpCapabilities,
  cleanupPeer,
} from '../../mediasoup/transports.js';
import type { User } from '../../../../shared/types.js';
import type * as mediasoup from 'mediasoup';
import { getIceServers } from '../../config/turn.js';

interface SocketData {
  user: Omit<User, 'password'>;
  sessionId?: string;
}

export function registerRtcHandlers(io: Server, socket: Socket) {
  const data = socket.data as SocketData;
  const peerId = data.user.id;

  socket.on('rtc:signal', (payload: { sessionId: string; signal: any }) => {
    socket.to(payload.sessionId).emit('rtc:signal', {
      from: peerId,
      signal: payload.signal,
    });
  });

  socket.on('rtc:getCapabilities', async (payload: { sessionId: string }, callback) => {
    try {
      const rtpCapabilities = await getRouterRtpCapabilities(payload.sessionId);
      callback({ rtpCapabilities, iceServers: getIceServers() });
    } catch (err) {
      callback({ error: (err as Error).message });
    }
  });

  socket.on(
    'rtc:createTransport',
    async (payload: { sessionId: string; direction: 'send' | 'recv' }, callback) => {
      try {
        const transport = await createWebRtcTransport(payload.sessionId, peerId, payload.direction);
        callback({ transport });
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    }
  );

  socket.on(
    'rtc:transport:connect',
    async (
      payload: {
        sessionId: string;
        transportId: string;
        dtlsParameters: mediasoup.types.DtlsParameters;
      },
      callback
    ) => {
      try {
        await connectTransport(payload.sessionId, peerId, payload.transportId, payload.dtlsParameters);
        callback({ success: true });
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    }
  );

  socket.on(
    'rtc:produce',
    async (
      payload: {
        sessionId: string;
        transportId: string;
        kind: mediasoup.types.MediaKind;
        rtpParameters: mediasoup.types.RtpParameters;
      },
      callback
    ) => {
      try {
        const { id } = await createProducer(
          payload.sessionId,
          peerId,
          payload.transportId,
          payload.kind,
          payload.rtpParameters
        );

        socket.to(payload.sessionId).emit('rtc:new-producer', {
          producerId: id,
          kind: payload.kind,
          peerId,
          peerName: data.user.name,
        });

        callback({ producerId: id });
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    }
  );

  socket.on(
    'rtc:consume',
    async (
      payload: {
        sessionId: string;
        producerId: string;
        rtpCapabilities: mediasoup.types.RtpCapabilities;
      },
      callback
    ) => {
      try {
        const consumer = await createConsumer(
          payload.sessionId,
          peerId,
          payload.producerId,
          payload.rtpCapabilities
        );

        if (!consumer) {
          callback({ error: 'Cannot consume' });
          return;
        }

        callback({ consumer });
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    }
  );

  socket.on(
    'rtc:resumeConsumer',
    async (payload: { sessionId: string; consumerId: string }, callback) => {
      try {
        await resumeConsumer(payload.sessionId, peerId, payload.consumerId);
        callback({ success: true });
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    }
  );

  socket.on('rtc:getProducers', (payload: { sessionId: string }, callback) => {
    const producers = getProducersForSession(payload.sessionId).filter((p) => p.peerId !== peerId);
    callback({ producers });
  });

  socket.on('disconnect', () => {
    if (data.sessionId) {
      cleanupPeer(data.sessionId, peerId);
      socket.to(data.sessionId).emit('rtc:peer-left', { peerId });
    }
  });
}

export function registerAdminHandlers(io: Server, socket: Socket) {
  const data = socket.data as SocketData;

  if (data.user.role !== 'admin') return;

  socket.join('admin-room');
}
