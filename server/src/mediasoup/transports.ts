import * as mediasoup from 'mediasoup';
import { getOrCreateRouter } from './router.js';

interface ParticipantTransports {
  sendTransport?: mediasoup.types.WebRtcTransport;
  recvTransport?: mediasoup.types.WebRtcTransport;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
}

const sessionParticipants = new Map<string, Map<string, ParticipantTransports>>();

function getParticipantMap(sessionId: string): Map<string, ParticipantTransports> {
  let map = sessionParticipants.get(sessionId);
  if (!map) {
    map = new Map();
    sessionParticipants.set(sessionId, map);
  }
  return map;
}

function getParticipant(sessionId: string, peerId: string): ParticipantTransports {
  const map = getParticipantMap(sessionId);
  let participant = map.get(peerId);
  if (!participant) {
    participant = {
      producers: new Map(),
      consumers: new Map(),
    };
    map.set(peerId, participant);
  }
  return participant;
}

const listenIps: mediasoup.types.TransportListenIp[] = [
  {
    ip: '0.0.0.0',
    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
  },
];

const webRtcTransportOptions = {
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 1000000,
};

export async function createWebRtcTransport(
  sessionId: string,
  peerId: string,
  direction: 'send' | 'recv'
): Promise<{
  id: string;
  iceParameters: mediasoup.types.IceParameters;
  iceCandidates: mediasoup.types.IceCandidate[];
  dtlsParameters: mediasoup.types.DtlsParameters;
}> {
  const router = await getOrCreateRouter(sessionId);
  const transport = await router.createWebRtcTransport({
    ...webRtcTransportOptions,
    listenIps,
    appData: { peerId, direction },
  });

  const participant = getParticipant(sessionId, peerId);

  if (direction === 'send') {
    participant.sendTransport = transport;
  } else {
    participant.recvTransport = transport;
  }

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') {
      transport.close();
    }
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

export async function connectTransport(
  sessionId: string,
  peerId: string,
  transportId: string,
  dtlsParameters: mediasoup.types.DtlsParameters
): Promise<void> {
  const participant = getParticipant(sessionId, peerId);
  const transport =
    participant.sendTransport?.id === transportId
      ? participant.sendTransport
      : participant.recvTransport?.id === transportId
        ? participant.recvTransport
        : undefined;

  if (!transport) {
    throw new Error(`Transport ${transportId} not found`);
  }

  await transport.connect({ dtlsParameters });
}

export async function createProducer(
  sessionId: string,
  peerId: string,
  transportId: string,
  kind: mediasoup.types.MediaKind,
  rtpParameters: mediasoup.types.RtpParameters
): Promise<{ id: string }> {
  const participant = getParticipant(sessionId, peerId);
  const transport = participant.sendTransport;

  if (!transport || transport.id !== transportId) {
    throw new Error('Send transport not found');
  }

  const producer = await transport.produce({ kind, rtpParameters });
  participant.producers.set(producer.id, producer);

  producer.on('transportclose', () => {
    participant.producers.delete(producer.id);
  });

  return { id: producer.id };
}

export async function createConsumer(
  sessionId: string,
  peerId: string,
  producerId: string,
  rtpCapabilities: mediasoup.types.RtpCapabilities
): Promise<{
  id: string;
  producerId: string;
  kind: mediasoup.types.MediaKind;
  rtpParameters: mediasoup.types.RtpParameters;
} | null> {
  const router = await getOrCreateRouter(sessionId);
  const participant = getParticipant(sessionId, peerId);
  const recvTransport = participant.recvTransport;

  if (!recvTransport) {
    throw new Error('Recv transport not found');
  }

  if (!router.canConsume({ producerId, rtpCapabilities })) {
    return null;
  }

  const consumer = await recvTransport.consume({
    producerId,
    rtpCapabilities,
    paused: true,
  });

  participant.consumers.set(consumer.id, consumer);

  consumer.on('transportclose', () => {
    participant.consumers.delete(consumer.id);
  });

  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}

export async function resumeConsumer(
  sessionId: string,
  peerId: string,
  consumerId: string
): Promise<void> {
  const participant = getParticipant(sessionId, peerId);
  const consumer = participant.consumers.get(consumerId);
  if (consumer) {
    await consumer.resume();
  }
}

export function getProducersForSession(sessionId: string): { peerId: string; producerId: string; kind: mediasoup.types.MediaKind }[] {
  const map = sessionParticipants.get(sessionId);
  if (!map) return [];

  const result: { peerId: string; producerId: string; kind: mediasoup.types.MediaKind }[] = [];
  for (const [peerId, participant] of map) {
    for (const [producerId, producer] of participant.producers) {
      result.push({ peerId, producerId, kind: producer.kind });
    }
  }
  return result;
}

export function cleanupPeer(sessionId: string, peerId: string): void {
  const map = sessionParticipants.get(sessionId);
  if (!map) return;

  const participant = map.get(peerId);
  if (!participant) return;

  participant.sendTransport?.close();
  participant.recvTransport?.close();
  map.delete(peerId);

  if (map.size === 0) {
    sessionParticipants.delete(sessionId);
    import('./router.js').then(({ closeRouter }) => closeRouter(sessionId));
  }
}

export async function getRouterRtpCapabilities(sessionId: string): Promise<mediasoup.types.RtpCapabilities> {
  const router = await getOrCreateRouter(sessionId);
  return router.rtpCapabilities;
}
